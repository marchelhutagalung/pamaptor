# GCP Deployment Guide — Pamaptor

## Prerequisites
- GCP project created
- `gcloud` CLI installed and authenticated
- Docker installed (for local testing)

---

## 1. GCP Cloud SQL (PostgreSQL)

```bash
# Enable Cloud SQL Admin API
gcloud services enable sqladmin.googleapis.com

# Create PostgreSQL 15 instance
gcloud sql instances create pamaptor-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-southeast2 \
  --storage-size=10GB

# Create database
gcloud sql databases create pamaptor --instance=pamaptor-db

# Create user
gcloud sql users create pamaptor_user \
  --instance=pamaptor-db \
  --password=YOUR_STRONG_PASSWORD
```

Connection string for Cloud Run:
```
DATABASE_URL="postgresql://pamaptor_user:YOUR_PASSWORD@/pamaptor?host=/cloudsql/PROJECT_ID:asia-southeast2:pamaptor-db"
```

---

## 2. GCP Cloud Storage

```bash
# Create bucket
gsutil mb -p PROJECT_ID -c STANDARD -l ASIA-SOUTHEAST2 gs://pamaptor-media

# Set bucket to uniform access
gsutil uniformbucketlevelaccess set on gs://pamaptor-media

# Make bucket publicly readable (for images)
gsutil iam ch allUsers:objectViewer gs://pamaptor-media

# Set CORS (replace YOUR_DOMAIN with actual Cloud Run URL)
gsutil cors set cors.json gs://pamaptor-media
```

Create `cors.json`:
```json
[
  {
    "origin": ["https://YOUR_CLOUDRUN_DOMAIN.run.app"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

---

## 3. Service Account

```bash
# Create service account
gcloud iam service-accounts create pamaptor-app \
  --display-name="Pamaptor App Service Account"

# Grant Cloud SQL access
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:pamaptor-app@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Grant Storage access (scoped to bucket)
gsutil iam ch \
  serviceAccount:pamaptor-app@PROJECT_ID.iam.gserviceaccount.com:roles/storage.objectAdmin \
  gs://pamaptor-media

# For local development: create and download key
gcloud iam service-accounts keys create ./service-account-key.json \
  --iam-account=pamaptor-app@PROJECT_ID.iam.gserviceaccount.com
```

---

## 4. Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## 5. Configure Resend (email)

1. Sign up at resend.com (free tier: 3,000 emails/month)
2. Verify your domain
3. Create an API key

---

## 6. Build and Push Docker Image

```bash
# Enable Container Registry / Artifact Registry
gcloud services enable containerregistry.googleapis.com

# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/pamaptor:latest

# OR using Docker directly:
docker build -t gcr.io/PROJECT_ID/pamaptor:latest .
docker push gcr.io/PROJECT_ID/pamaptor:latest
```

---

## 7. Run Database Migrations

```bash
# Create a Cloud Run Job for migrations
gcloud run jobs create pamaptor-migrate \
  --image gcr.io/PROJECT_ID/pamaptor:latest \
  --command "npx" \
  --args "prisma,migrate,deploy" \
  --region asia-southeast2 \
  --set-env-vars "DATABASE_URL=postgresql://pamaptor_user:PASSWORD@/pamaptor?host=/cloudsql/PROJECT_ID:asia-southeast2:pamaptor-db" \
  --add-cloudsql-instances PROJECT_ID:asia-southeast2:pamaptor-db \
  --service-account pamaptor-app@PROJECT_ID.iam.gserviceaccount.com

# Execute migrations
gcloud run jobs execute pamaptor-migrate --region asia-southeast2 --wait
```

---

## 8. Deploy to Cloud Run

```bash
gcloud run deploy pamaptor \
  --image gcr.io/PROJECT_ID/pamaptor:latest \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --add-cloudsql-instances PROJECT_ID:asia-southeast2:pamaptor-db \
  --service-account pamaptor-app@PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "NEXTAUTH_URL=https://pamaptor-XXXX-et.a.run.app" \
  --set-env-vars "NEXTAUTH_SECRET=your_secret_here" \
  --set-env-vars "DATABASE_URL=postgresql://pamaptor_user:PASSWORD@/pamaptor?host=/cloudsql/PROJECT_ID:asia-southeast2:pamaptor-db" \
  --set-env-vars "GCS_BUCKET_NAME=pamaptor-media" \
  --set-env-vars "GCP_PROJECT_ID=PROJECT_ID" \
  --set-env-vars "RESEND_API_KEY=re_your_key" \
  --min-instances 0 \
  --max-instances 3 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60
```

After first deploy, get the URL and update `NEXTAUTH_URL` with the actual Cloud Run URL, then redeploy.

---

## 9. Create First Admin User

After deploying, connect to Cloud SQL and run:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
```

Or use Cloud SQL Studio in GCP Console.

---

## 10. Estimated Costs (< 1000 users)

| Service | Usage | Estimated Cost |
|---------|-------|---------------|
| Cloud Run | ~100K requests/month, 512Mi | ~$0–5/month |
| Cloud SQL db-f1-micro | Always-on | ~$7/month |
| Cloud Storage | 10GB + egress | ~$0.20/month |
| **Total** | | **~$8–12/month** |

To minimize costs: Cloud SQL can be stopped when not in use (dev/staging), and Cloud Run scales to zero automatically.
