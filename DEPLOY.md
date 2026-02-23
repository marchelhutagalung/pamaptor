# GCP Deployment Guide — Pamaptor

Target stack: **Cloud Run** + **Cloud SQL (PostgreSQL 15)** + **Cloud Storage** + **Nodemailer SMTP**

---

## Prerequisites

Before starting, make sure you have:

- A GCP project created — note your `PROJECT_ID`
- [`gcloud` CLI](https://cloud.google.com/sdk/docs/install) installed and authenticated
- Docker installed locally (only if building locally — optional)
- A Gmail account for sending emails

```bash
# Authenticate
gcloud auth login

# Set your project (replace with your real project ID)
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  sqladmin.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

---

## Step 1 — Cloud SQL (PostgreSQL)

```bash
# Create instance (db-f1-micro = cheapest tier, ~$7/month, always-on)
gcloud sql instances create pamaptor-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-southeast2 \
  --storage-size=10GB \
  --storage-auto-increase

# Create the database
gcloud sql databases create pamaptor --instance=pamaptor-db

# Create a user (replace CHANGE_THIS_PASSWORD with something strong)
gcloud sql users create pamaptor_user \
  --instance=pamaptor-db \
  --password=CHANGE_THIS_PASSWORD
```

Your `DATABASE_URL` for Cloud Run (Unix socket format):
```
postgresql://pamaptor_user:CHANGE_THIS_PASSWORD@/pamaptor?host=/cloudsql/PROJECT_ID:asia-southeast2:pamaptor-db
```

> 💡 Save this value — you'll need it in Steps 7, 8, and 9.

---

## Step 2 — Cloud Storage (media uploads)

```bash
# Create bucket
gsutil mb -p $PROJECT_ID -c STANDARD -l ASIA-SOUTHEAST2 gs://pamaptor-media

# Enable uniform bucket-level access
gsutil uniformbucketlevelaccess set on gs://pamaptor-media

# Make bucket publicly readable (so users can view uploaded images)
gsutil iam ch allUsers:objectViewer gs://pamaptor-media
```

> After deploying in Step 9, come back here to set CORS (see Step 9b).

---

## Step 3 — Service Account

```bash
# Create service account for the app
gcloud iam service-accounts create pamaptor-app \
  --display-name="Pamaptor App"

# Grant Cloud SQL access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:pamaptor-app@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Grant Storage access (scoped to the bucket only)
gsutil iam ch \
  serviceAccount:pamaptor-app@${PROJECT_ID}.iam.gserviceaccount.com:roles/storage.objectAdmin \
  gs://pamaptor-media
```

---

## Step 4 — Gmail SMTP Setup

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** if not already on
3. Go to https://myaccount.google.com/apppasswords
4. Create an App Password → name it `Pamaptor`
5. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

Your SMTP env vars will be:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=Pamaptor <yourname@gmail.com>
```

> Gmail free tier allows **500 emails/day** — enough for ~200 users.

---

## Step 5 — Generate Secrets

```bash
# NextAuth secret (run this, copy the output)
openssl rand -base64 32

# Admin registration secret (run this, copy the output)
openssl rand -hex 24
```

Save both values — you'll use them in Step 9.

---

## Step 6 — Build & Push Docker Image

```bash
# Create Artifact Registry repository (one-time setup)
gcloud artifacts repositories create pamaptor \
  --repository-format=docker \
  --location=asia-southeast2

# Build and push via Cloud Build (recommended — no local Docker needed)
gcloud builds submit \
  --tag asia-southeast2-docker.pkg.dev/${PROJECT_ID}/pamaptor/app:latest

# ── OR build locally and push ──────────────────────────────────────────────
docker build -t asia-southeast2-docker.pkg.dev/${PROJECT_ID}/pamaptor/app:latest .
docker push asia-southeast2-docker.pkg.dev/${PROJECT_ID}/pamaptor/app:latest
```

---

## Step 7 — Run Database Migrations

```bash
# Create a one-off Cloud Run Job for migrations
gcloud run jobs create pamaptor-migrate \
  --image asia-southeast2-docker.pkg.dev/${PROJECT_ID}/pamaptor/app:latest \
  --command "npx" \
  --args "prisma,migrate,deploy" \
  --region asia-southeast2 \
  --set-env-vars "DATABASE_URL=postgresql://pamaptor_user:CHANGE_THIS_PASSWORD@/pamaptor?host=/cloudsql/${PROJECT_ID}:asia-southeast2:pamaptor-db" \
  --add-cloudsql-instances ${PROJECT_ID}:asia-southeast2:pamaptor-db \
  --service-account pamaptor-app@${PROJECT_ID}.iam.gserviceaccount.com

# Execute the migration job
gcloud run jobs execute pamaptor-migrate --region asia-southeast2 --wait
```

---

## Step 8 — Seed Categories (one-time)

This seeds all 34 incident categories + "Lainnya" into the database.

```bash
# Create a one-off Cloud Run Job for seeding
gcloud run jobs create pamaptor-seed \
  --image asia-southeast2-docker.pkg.dev/${PROJECT_ID}/pamaptor/app:latest \
  --command "npx" \
  --args "ts-node,--compiler-options,{\"module\":\"CommonJS\"},prisma/seed.ts" \
  --region asia-southeast2 \
  --set-env-vars "DATABASE_URL=postgresql://pamaptor_user:CHANGE_THIS_PASSWORD@/pamaptor?host=/cloudsql/${PROJECT_ID}:asia-southeast2:pamaptor-db" \
  --add-cloudsql-instances ${PROJECT_ID}:asia-southeast2:pamaptor-db \
  --service-account pamaptor-app@${PROJECT_ID}.iam.gserviceaccount.com

# Execute the seed job
gcloud run jobs execute pamaptor-seed --region asia-southeast2 --wait
```

> ✅ The seed uses `upsert` — safe to re-run anytime without creating duplicates.
> If categories are updated in `prisma/seed.ts`, rebuild the image (Step 6) and re-run this job.

---

## Step 9 — Deploy to Cloud Run

```bash
gcloud run deploy pamaptor \
  --image asia-southeast2-docker.pkg.dev/${PROJECT_ID}/pamaptor/app:latest \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --add-cloudsql-instances ${PROJECT_ID}:asia-southeast2:pamaptor-db \
  --service-account pamaptor-app@${PROJECT_ID}.iam.gserviceaccount.com \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "DATABASE_URL=postgresql://pamaptor_user:CHANGE_THIS_PASSWORD@/pamaptor?host=/cloudsql/${PROJECT_ID}:asia-southeast2:pamaptor-db" \
  --set-env-vars "NEXTAUTH_URL=https://PLACEHOLDER.run.app" \
  --set-env-vars "NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET" \
  --set-env-vars "NEXT_PUBLIC_APP_URL=https://PLACEHOLDER.run.app" \
  --set-env-vars "GCS_BUCKET_NAME=pamaptor-media" \
  --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID}" \
  --set-env-vars "SMTP_HOST=smtp.gmail.com" \
  --set-env-vars "SMTP_PORT=587" \
  --set-env-vars "SMTP_USER=yourname@gmail.com" \
  --set-env-vars "SMTP_PASS=xxxx xxxx xxxx xxxx" \
  --set-env-vars "SMTP_FROM=Pamaptor <yourname@gmail.com>" \
  --set-env-vars "ADMIN_REGISTER_SECRET=YOUR_ADMIN_SECRET" \
  --min-instances 0 \
  --max-instances 3 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60
```

### Step 9b — Update URL & CORS after first deploy

After deploy, get the real Cloud Run URL:
```bash
gcloud run services describe pamaptor \
  --region asia-southeast2 \
  --format='value(status.url)'
# Example output: https://pamaptor-xxxxxxxx-et.a.run.app
```

Update the env vars with the real URL:
```bash
gcloud run services update pamaptor \
  --region asia-southeast2 \
  --set-env-vars "NEXTAUTH_URL=https://pamaptor-xxxxxxxx-et.a.run.app" \
  --set-env-vars "NEXT_PUBLIC_APP_URL=https://pamaptor-xxxxxxxx-et.a.run.app"
```

Set CORS on the GCS bucket:
```bash
cat > /tmp/cors.json << 'EOF'
[
  {
    "origin": ["https://pamaptor-xxxxxxxx-et.a.run.app"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set /tmp/cors.json gs://pamaptor-media
```

---

## Step 10 — Create First Admin Account

1. Open `https://YOUR_CLOUDRUN_URL/register-admin`
2. Fill in your name, email, and password
3. Enter the `ADMIN_REGISTER_SECRET` you generated in Step 5
4. Check your email for a verification link and click it
5. You're now logged in as admin ✅

---

## Step 11 — Custom Domain (optional)

### 11a. Buy a domain

Purchase from any registrar (Niagahoster, Namecheap, Cloudflare, etc.)

### 11b. Map domain to Cloud Run

```bash
gcloud run domain-mappings create \
  --service pamaptor \
  --domain pamaptor.com \
  --region asia-southeast2
```

GCP will output DNS records to add at your registrar:

| Type | Name | Value |
|------|------|-------|
| A | @ | `(IP from gcloud output)` |
| AAAA | @ | `(IPv6 from gcloud output)` |
| CNAME | www | `ghs.googlehosted.com.` |

> SSL certificate is provisioned automatically by Google (may take 15–30 min after DNS propagates).

After DNS propagates, update env vars:
```bash
gcloud run services update pamaptor \
  --region asia-southeast2 \
  --set-env-vars "NEXTAUTH_URL=https://pamaptor.com" \
  --set-env-vars "NEXT_PUBLIC_APP_URL=https://pamaptor.com"
```

Also update the CORS origin on the GCS bucket (Step 9b) with the custom domain.

### 11c. Custom email domain — `noreply@pamaptor.com` (optional)

Use **Zoho Mail** (free for up to 5 users):

1. Sign up at https://www.zoho.com/mail/ (free plan)
2. Add and verify `pamaptor.com` as your domain
3. Create mailbox: `noreply@pamaptor.com`
4. Add these DNS records at your registrar:

```
# MX records (required for domain verification)
MX  @  mx.zoho.com   (priority 10)
MX  @  mx2.zoho.com  (priority 20)
MX  @  mx3.zoho.com  (priority 50)

# SPF — authorizes Zoho to send on your behalf
TXT  @  "v=spf1 include:zoho.com ~all"

# DKIM — email signature (Zoho generates the key value for you)
TXT  zmail._domainkey  "v=DKIM1; k=rsa; p=YOUR_KEY_FROM_ZOHO"

# DMARC — policy for failed email auth
TXT  _dmarc  "v=DMARC1; p=quarantine; rua=mailto:admin@pamaptor.com"
```

5. Update SMTP env vars to use Zoho:
```bash
gcloud run services update pamaptor \
  --region asia-southeast2 \
  --set-env-vars "SMTP_HOST=smtp.zoho.com" \
  --set-env-vars "SMTP_PORT=587" \
  --set-env-vars "SMTP_USER=noreply@pamaptor.com" \
  --set-env-vars "SMTP_PASS=your-zoho-password" \
  --set-env-vars "SMTP_FROM=Pamaptor <noreply@pamaptor.com>"
```

> Zoho free tier: **50 emails/day** — sufficient for registration + password resets at ~200 users.

---

## Redeployment (for updates)

Every time you push code changes:

```bash
# 1. Build and push new image
gcloud builds submit \
  --tag asia-southeast2-docker.pkg.dev/${PROJECT_ID}/pamaptor/app:latest

# 2. Run migrations if you changed prisma/schema.prisma
gcloud run jobs execute pamaptor-migrate --region asia-southeast2 --wait

# 3. Re-seed if you updated prisma/seed.ts (categories, etc.)
gcloud run jobs execute pamaptor-seed --region asia-southeast2 --wait

# 4. Deploy new revision
gcloud run deploy pamaptor \
  --image asia-southeast2-docker.pkg.dev/${PROJECT_ID}/pamaptor/app:latest \
  --region asia-southeast2
```

---

## Save Money During Development

Stop Cloud SQL when not in use to avoid the $7/month charge:

```bash
# Stop (pause billing)
gcloud sql instances patch pamaptor-db --activation-policy=NEVER

# Start again
gcloud sql instances patch pamaptor-db --activation-policy=ALWAYS
```

---

## Estimated Costs (< 200 users)

| Service | Spec | Est. Cost/month |
|---------|------|----------------|
| Cloud Run | min 0, max 3, 512Mi | ~$0–5 |
| Cloud SQL | db-f1-micro, always-on | ~$7 |
| Cloud Storage | ~5GB media | ~$0.20 |
| Gmail SMTP | Free (500/day) | $0 |
| **Subtotal (no custom domain)** | | **~$8–12** |
| Custom domain (optional) | .com registration | ~$1/month |
| Zoho Mail (optional) | Free (5 users, 50/day) | $0 |
| **Total with custom domain** | | **~$9–13** |

---

## Quick Reference — All Commands in Order

```bash
export PROJECT_ID="your-gcp-project-id"

# 1. APIs
gcloud services enable sqladmin.googleapis.com run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# 2. Database
gcloud sql instances create pamaptor-db --database-version=POSTGRES_15 --tier=db-f1-micro --region=asia-southeast2 --storage-size=10GB --storage-auto-increase
gcloud sql databases create pamaptor --instance=pamaptor-db
gcloud sql users create pamaptor_user --instance=pamaptor-db --password=CHANGE_THIS_PASSWORD

# 3. Storage
gsutil mb -p $PROJECT_ID -c STANDARD -l ASIA-SOUTHEAST2 gs://pamaptor-media
gsutil uniformbucketlevelaccess set on gs://pamaptor-media
gsutil iam ch allUsers:objectViewer gs://pamaptor-media

# 4. Service account
gcloud iam service-accounts create pamaptor-app --display-name="Pamaptor App"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:pamaptor-app@${PROJECT_ID}.iam.gserviceaccount.com" --role="roles/cloudsql.client"
gsutil iam ch serviceAccount:pamaptor-app@${PROJECT_ID}.iam.gserviceaccount.com:roles/storage.objectAdmin gs://pamaptor-media

# 5. Artifact registry + image
gcloud artifacts repositories create pamaptor --repository-format=docker --location=asia-southeast2
gcloud builds submit --tag asia-southeast2-docker.pkg.dev/${PROJECT_ID}/pamaptor/app:latest

# 6. Migrate + Seed
gcloud run jobs execute pamaptor-migrate --region asia-southeast2 --wait
gcloud run jobs execute pamaptor-seed --region asia-southeast2 --wait

# 7. Deploy
gcloud run deploy pamaptor --image asia-southeast2-docker.pkg.dev/${PROJECT_ID}/pamaptor/app:latest --region asia-southeast2 --allow-unauthenticated ...
```
