# 🚀 Pamaptor — GCP Deployment Guide

## Architecture Overview

```
GitHub ──push──► GitHub Actions ──build/push──► Artifact Registry
                                                        │
                                                   Cloud Run  ◄──── Secret Manager (env vars)
                                                        │
                                               Cloud SQL (PostgreSQL)
                                               GCS Bucket (media/selfie)

pamaptor.com ──► Cloudflare (CDN + DNS + SSL) ──► Cloud Run URL
                                                        │
                                            Hostinger SMTP (email)
```

**Why Cloudflare for CDN instead of Google Cloud CDN?**
Google Cloud CDN requires a Load Balancer (~$18/month fixed cost). Cloudflare free tier gives
you global CDN, DDoS protection, and auto SSL at $0 — the better choice for cost reduction.

---

## Prerequisites — Install tools locally

```bash
# Install Google Cloud CLI
brew install google-cloud-sdk        # macOS
# or visit: https://cloud.google.com/sdk/docs/install

# Install Docker Desktop
# https://docs.docker.com/desktop/install/mac-install/

# Verify
gcloud --version
docker --version
```

---

## Phase 1 — GCP Project Setup

### 1.1 Create & configure GCP project

```bash
# Login to GCP
gcloud auth login

# Create new project  (replace project-eca091cb-172a-4d4f-b1e with your preferred project ID)
gcloud projects create project-eca091cb-172a-4d4f-b1e --name="Pamaptor"

# Set as default project
gcloud config set project project-eca091cb-172a-4d4f-b1e

# Link billing account (required for Cloud Run + Cloud SQL)
# Go to: https://console.cloud.google.com/billing
# Link the billing account to project-eca091cb-172a-4d4f-b1e
```

### 1.2 Enable required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com
```

---

## Phase 2 — Cloud SQL (PostgreSQL)

### 2.1 Create the database instance

```bash
# db-f1-micro is the cheapest tier (~$10/month)
gcloud sql instances create pamaptor-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-southeast1 \
  --storage-auto-increase \
  --storage-size=10GB

# Note down the connection name — you will need it in Phase 5
gcloud sql instances describe pamaptor-db --format="value(connectionName)"
# Example output: project-eca091cb-172a-4d4f-b1e:asia-southeast1:pamaptor-db
```

### 2.2 Create database and user

```bash
# Create database
gcloud sql databases create pamaptor --instance=pamaptor-db

# Create app user  (replace YOUR_DB_PASSWORD with a strong password)
gcloud sql users create pamaptor_user \
  --instance=pamaptor-db \
  --password=YOUR_DB_PASSWORD
```

### 2.3 DATABASE_URL format for Cloud Run

Cloud Run connects to PostgreSQL via Unix socket (not TCP). Use this format:

```
postgresql://pamaptor_user:YOUR_DB_PASSWORD@localhost/pamaptor?host=/cloudsql/project-eca091cb-172a-4d4f-b1e:asia-southeast1:pamaptor-db
```

---

## Phase 3 — GCS Bucket (Media Storage)

```bash
# Create bucket in the same region
gcloud storage buckets create gs://pamaptor-media \
  --location=asia-southeast1 \
  --uniform-bucket-level-access

# Allow public read for post images and selfies
gcloud storage buckets add-iam-policy-binding gs://pamaptor-media \
  --member=allUsers \
  --role=roles/storage.objectViewer
```

---

## Phase 4 — Service Accounts & IAM

### 4.1 Cloud Run service account (runtime identity)

```bash
gcloud iam service-accounts create pamaptor-cloudrun \
  --display-name="Pamaptor Cloud Run SA"

# Cloud SQL
gcloud projects add-iam-policy-binding project-eca091cb-172a-4d4f-b1e \
  --member="serviceAccount:pamaptor-cloudrun@project-eca091cb-172a-4d4f-b1e.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# GCS
gcloud projects add-iam-policy-binding project-eca091cb-172a-4d4f-b1e \
  --member="serviceAccount:pamaptor-cloudrun@project-eca091cb-172a-4d4f-b1e.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Secret Manager
gcloud projects add-iam-policy-binding project-eca091cb-172a-4d4f-b1e \
  --member="serviceAccount:pamaptor-cloudrun@project-eca091cb-172a-4d4f-b1e.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 4.2 GitHub Actions service account (CI/CD deploy identity)

```bash
gcloud iam service-accounts create pamaptor-github-actions \
  --display-name="Pamaptor GitHub Actions SA"

# Push Docker images
gcloud projects add-iam-policy-binding project-eca091cb-172a-4d4f-b1e \
  --member="serviceAccount:pamaptor-github-actions@project-eca091cb-172a-4d4f-b1e.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Deploy Cloud Run
gcloud projects add-iam-policy-binding project-eca091cb-172a-4d4f-b1e \
  --member="serviceAccount:pamaptor-github-actions@project-eca091cb-172a-4d4f-b1e.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Allow deploying as the Cloud Run SA
gcloud iam service-accounts add-iam-policy-binding \
  pamaptor-cloudrun@project-eca091cb-172a-4d4f-b1e.iam.gserviceaccount.com \
  --member="serviceAccount:pamaptor-github-actions@project-eca091cb-172a-4d4f-b1e.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### 4.3 Workload Identity Federation (keyless auth for GitHub Actions)

> JSON key creation is blocked by org policy. Use Workload Identity Federation instead — no long-lived credentials needed.

```bash
# Create the Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
  --project="project-eca091cb-172a-4d4f-b1e" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create the OIDC Provider  (replace YOUR_GITHUB_USERNAME/pamaptor with your actual repo)
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="project-eca091cb-172a-4d4f-b1e" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='YOUR_GITHUB_USERNAME/pamaptor'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Bind the SA to your GitHub repo  (replace YOUR_GITHUB_USERNAME/pamaptor)
gcloud iam service-accounts add-iam-policy-binding \
  pamaptor-github-actions@project-eca091cb-172a-4d4f-b1e.iam.gserviceaccount.com \
  --project="project-eca091cb-172a-4d4f-b1e" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/556319918654/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_USERNAME/pamaptor"

# Get the provider resource name — copy this into GitHub Secrets
gcloud iam workload-identity-pools providers describe github-provider \
  --project="project-eca091cb-172a-4d4f-b1e" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(name)"
# Output looks like:
# projects/556319918654/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

---

## Phase 5 — Secret Manager (Environment Variables)

```bash
# Run each line, replacing placeholder values with real ones

# Generate NEXTAUTH_SECRET:  openssl rand -base64 32
# Generate ADMIN_REGISTER_SECRET:  openssl rand -hex 24

echo -n "YOUR_NEXTAUTH_SECRET"     | gcloud secrets create NEXTAUTH_SECRET --data-file=- --replication-policy=automatic
echo -n "https://pamaptor.com"     | gcloud secrets create NEXTAUTH_URL --data-file=- --replication-policy=automatic
echo -n "https://pamaptor.com"     | gcloud secrets create NEXT_PUBLIC_APP_URL --data-file=- --replication-policy=automatic

# Use the DATABASE_URL from Phase 2.3
echo -n "postgresql://pamaptor_user:YOUR_DB_PASSWORD@localhost/pamaptor?host=/cloudsql/project-eca091cb-172a-4d4f-b1e:asia-southeast1:pamaptor-db" \
  | gcloud secrets create DATABASE_URL --data-file=- --replication-policy=automatic

echo -n "project-eca091cb-172a-4d4f-b1e"            | gcloud secrets create GCP_PROJECT_ID --data-file=- --replication-policy=automatic
echo -n "pamaptor-media"           | gcloud secrets create GCS_BUCKET_NAME --data-file=- --replication-policy=automatic

# Hostinger SMTP — get credentials from:
# Hostinger dashboard → Emails → Manage → Mail settings
echo -n "smtp.hostinger.com"                   | gcloud secrets create SMTP_HOST --data-file=- --replication-policy=automatic
echo -n "587"                                  | gcloud secrets create SMTP_PORT --data-file=- --replication-policy=automatic
echo -n "noreply@pamaptor.com"                 | gcloud secrets create SMTP_USER --data-file=- --replication-policy=automatic
echo -n "YOUR_HOSTINGER_EMAIL_PASSWORD"        | gcloud secrets create SMTP_PASS --data-file=- --replication-policy=automatic
echo -n "Pamaptor <noreply@pamaptor.com>"      | gcloud secrets create SMTP_FROM --data-file=- --replication-policy=automatic

echo -n "YOUR_ADMIN_REGISTER_SECRET"           | gcloud secrets create ADMIN_REGISTER_SECRET --data-file=- --replication-policy=automatic

# CDN URL — after you deploy the Cloudflare Worker in Phase 8 CDN section
echo -n "https://cdn.pamaptor.com"             | gcloud secrets create CDN_URL --data-file=- --replication-policy=automatic
```

---

## Phase 6 — Artifact Registry (Docker Image Repo)

```bash
gcloud artifacts repositories create pamaptor \
  --repository-format=docker \
  --location=asia-southeast1 \
  --description="Pamaptor Docker images"

# Authorize local Docker to push
gcloud auth configure-docker asia-southeast1-docker.pkg.dev
```

---

## Phase 7 — GitHub Actions CI/CD

### 7.1 Add secrets to your GitHub repository

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|---|---|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Provider resource name from Phase 4.3 (e.g. `projects/556319918654/locations/global/...`) |
| `GCP_SERVICE_ACCOUNT` | `pamaptor-github-actions@project-eca091cb-172a-4d4f-b1e.iam.gserviceaccount.com` |
| `GCP_PROJECT_ID` | `project-eca091cb-172a-4d4f-b1e` |

### 7.2 Create the workflow file

Create `.github/workflows/deploy.yml` in your project:

```yaml
name: Build & Deploy to Cloud Run

on:
  push:
    branches: [main]

env:
  REGION: asia-southeast1
  IMAGE: asia-southeast1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/pamaptor/pamaptor

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write   # required for Workload Identity Federation

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker auth
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev --quiet

      - name: Build & push Docker image
        run: |
          docker build \
            --tag ${{ env.IMAGE }}:${{ github.sha }} \
            --tag ${{ env.IMAGE }}:latest \
            .
          docker push ${{ env.IMAGE }}:${{ github.sha }}
          docker push ${{ env.IMAGE }}:latest

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy pamaptor \
            --image=${{ env.IMAGE }}:${{ github.sha }} \
            --region=${{ env.REGION }} \
            --platform=managed \
            --service-account=pamaptor-cloudrun@${{ secrets.GCP_PROJECT_ID }}.iam.gserviceaccount.com \
            --add-cloudsql-instances=${{ secrets.GCP_PROJECT_ID }}:${{ env.REGION }}:pamaptor-db \
            --set-secrets="\
              DATABASE_URL=DATABASE_URL:latest,\
              NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,\
              NEXTAUTH_URL=NEXTAUTH_URL:latest,\
              NEXT_PUBLIC_APP_URL=NEXT_PUBLIC_APP_URL:latest,\
              GCP_PROJECT_ID=GCP_PROJECT_ID:latest,\
              GCS_BUCKET_NAME=GCS_BUCKET_NAME:latest,\
              SMTP_HOST=SMTP_HOST:latest,\
              SMTP_PORT=SMTP_PORT:latest,\
              SMTP_USER=SMTP_USER:latest,\
              SMTP_PASS=SMTP_PASS:latest,\
              SMTP_FROM=SMTP_FROM:latest,\
              ADMIN_REGISTER_SECRET=ADMIN_REGISTER_SECRET:latest,\
              CDN_URL=CDN_URL:latest" \
            --allow-unauthenticated \
            --min-instances=0 \
            --max-instances=10 \
            --memory=512Mi \
            --cpu=1 \
            --port=8080 \
            --timeout=60s
```

### 7.3 Run Prisma migration (first deploy only)

```bash
# Create a one-off Cloud Run Job for the migration
gcloud run jobs create pamaptor-migrate \
  --image=asia-southeast1-docker.pkg.dev/project-eca091cb-172a-4d4f-b1e/pamaptor/pamaptor:latest \
  --region=asia-southeast1 \
  --service-account=pamaptor-cloudrun@project-eca091cb-172a-4d4f-b1e.iam.gserviceaccount.com \
  --set-cloudsql-instances=project-eca091cb-172a-4d4f-b1e:asia-southeast1:pamaptor-db \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest" \
  --command="prisma" \
  --args="migrate,deploy" \
  --memory=1Gi

# Run it
gcloud run jobs execute pamaptor-migrate --region=asia-southeast1 --wait
```

---

## Phase 8 — Domain + CDN via Cloudflare (Free)

### 8.1 Add pamaptor.com to Cloudflare

1. Go to [cloudflare.com](https://cloudflare.com) → sign up / log in
2. Click **Add a site** → enter `pamaptor.com` → choose **Free plan**
3. Cloudflare will scan existing DNS records — keep your Hostinger **MX** and **TXT** records
4. Note the **2 Cloudflare nameservers** shown (e.g. `ada.ns.cloudflare.com`)

### 8.2 Update nameservers at your domain registrar

1. Log in to wherever you bought `pamaptor.com`
2. Find **DNS / Nameservers settings**
3. Replace all existing nameservers with the 2 Cloudflare ones
4. Save — propagation takes 5–30 minutes

### 8.3 Get your Cloud Run URL

```bash
gcloud run services describe pamaptor \
  --region=asia-southeast1 \
  --format="value(status.url)"
# Output: https://pamaptor-xxxxxxxxxx-et.a.run.app
```

### 8.4 Add DNS records in Cloudflare

Go to Cloudflare → **DNS** tab → add these records:

| Type | Name | Content | Proxy status |
|---|---|---|---|
| `CNAME` | `@` | `pamaptor-xxxxxxxxxx-et.a.run.app` | ✅ Proxied (orange cloud) |
| `CNAME` | `www` | `pamaptor.com` | ✅ Proxied (orange cloud) |
| `MX` | `@` | *(keep all Hostinger MX records)* | ⬜ DNS only (grey cloud) |
| `TXT` | `@` | *(keep all Hostinger SPF/DKIM TXT records)* | ⬜ DNS only (grey cloud) |

> ⚠️ MX and TXT records for email **must** stay as DNS only (grey cloud).
> Setting them to Proxied will break your Hostinger email.

### 8.5 Configure Cloudflare SSL & CDN

In Cloudflare Dashboard:

**SSL/TLS:**
- Mode → **Full (strict)**

**Caching → Cache Rules → Create rule #1** (Next.js static assets):
- Expression: `http.request.uri.path contains "/_next/static/"`
- Cache setting: Cache Everything / Edge TTL: **1 month**

**Caching → Cache Rules → Create rule #2** (Next.js optimized images):
- Expression: `http.request.uri.path contains "/_next/image"`
- Cache setting: Cache Everything / Edge TTL: **1 month**

### 8.6 Deploy Cloudflare Worker for cdn.pamaptor.com (GCS CDN)

This makes all uploaded images (post photos, selfies) served from Cloudflare's edge
instead of hitting GCS origin — reducing GCS egress costs and improving load speed.

```bash
# Install wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy the worker (from project root)
cd cloudflare-worker && wrangler deploy
```

5. Add a Custom Domain (in Cloudflare Dashboard):
   - **Workers & Pages → your-worker → Settings → Domains & Routes → Add Custom Domain**
   - Enter: `cdn.pamaptor.com`
   - Cloudflare automatically adds the DNS record and provisions SSL

6. Add `CDN_URL` secret to Secret Manager (if not done in Phase 5):
   ```bash
   echo -n "https://cdn.pamaptor.com" | gcloud secrets create CDN_URL --data-file=- --replication-policy=automatic
   ```

7. Redeploy Cloud Run to pick up the new secret:
   ```bash
   gcloud run services update pamaptor \
     --update-secrets="CDN_URL=CDN_URL:latest" \
     --region=asia-southeast1
   ```

> ℹ️ **How the CDN works after this:**
> - New uploads → `gcs.ts` returns `https://cdn.pamaptor.com/posts/xxx.jpg`
> - Browser/next/image requests `cdn.pamaptor.com/posts/xxx.jpg`
> - Cloudflare Worker fetches from GCS once, caches at edge for 1 year
> - All subsequent requests are served from Cloudflare — GCS is never hit again

### 8.7 Map custom domain to Cloud Run

For `asia-southeast1`, use Cloud Run domain mappings so requests for
`pamaptor.com` and `www.pamaptor.com` are accepted directly by Cloud Run.

```bash
gcloud beta run domain-mappings create \
  --service=pamaptor \
  --domain=pamaptor.com \
  --region=asia-southeast1

gcloud beta run domain-mappings create \
  --service=pamaptor \
  --domain=www.pamaptor.com \
  --region=asia-southeast1
```

Then verify DNS targets:
```bash
gcloud beta run domain-mappings describe \
  --domain=pamaptor.com \
  --region=asia-southeast1

gcloud beta run domain-mappings describe \
  --domain=www.pamaptor.com \
  --region=asia-southeast1
```

---

## Phase 9 — Verify

```bash
# Check service status
gcloud run services describe pamaptor --region=asia-southeast1

# Live logs
gcloud run services logs tail pamaptor --region=asia-southeast1

# Test HTTPS direct
curl -I https://pamaptor-xxxxxxxxxx-et.a.run.app

# Test via Cloudflare domain
curl -I https://pamaptor.com
```

---

## Cost Estimate (Monthly)

| Service | Details | Cost |
|---|---|---|
| Cloud Run | First 2M requests free | ~$0–5 |
| Cloud SQL (db-f1-micro) | Always on | ~$10 |
| GCS Storage | First 5 GB free | ~$0–1 |
| Artifact Registry | First 0.5 GB free | ~$0 |
| Cloudflare CDN | Free plan | **$0** |
| **Total** | | **~$10–16/month** |

> 💡 **Save cost during development:** Stop Cloud SQL when not using it:
> `gcloud sql instances patch pamaptor-db --activation-policy=NEVER`
> Re-enable: `gcloud sql instances patch pamaptor-db --activation-policy=ALWAYS`

---

## Useful Commands

```bash
# Tail live logs
gcloud run services logs tail pamaptor --region=asia-southeast1

# Update a secret value
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-

# Connect to Cloud SQL locally (debugging)
gcloud sql connect pamaptor-db --user=pamaptor_user --database=pamaptor

# Scale to zero (save cost)
gcloud run services update pamaptor --min-instances=0 --region=asia-southeast1

# Roll back to a previous revision
gcloud run services update-traffic pamaptor \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=asia-southeast1
```
