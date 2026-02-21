import path from "path";
import fs from "fs/promises";

// ---------------------------------------------------------------------------
// Local filesystem fallback for development (when GCS is not configured)
// ---------------------------------------------------------------------------
// isDevMode used in uploadToGCS below

async function uploadToLocal(
  file: Buffer,
  destination: string
): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const fullDir = path.join(uploadDir, path.dirname(destination));
  await fs.mkdir(fullDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, destination), file);
  return `/uploads/${destination}`;
}

// ---------------------------------------------------------------------------
// GCS (production)
// ---------------------------------------------------------------------------
async function getGCSBucket() {
  const { Storage } = await import("@google-cloud/storage");
  const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    ...(process.env.GCP_CREDENTIALS_PATH && {
      keyFilename: process.env.GCP_CREDENTIALS_PATH,
    }),
  });
  return storage.bucket(process.env.GCS_BUCKET_NAME!);
}

export async function uploadToGCS(
  file: Buffer,
  destination: string,
  contentType: string
): Promise<string> {
  // Use local filesystem in dev if GCS is not configured
  if (
    process.env.NODE_ENV !== "production" &&
    (!process.env.GCS_BUCKET_NAME || process.env.GCS_BUCKET_NAME === "pamaptor-media" && !process.env.GCP_CREDENTIALS_PATH)
  ) {
    console.log(`[DEV] Saving file locally: /uploads/${destination}`);
    return uploadToLocal(file, destination);
  }

  const bucket = await getGCSBucket();
  const blob = bucket.file(destination);
  await blob.save(file, {
    contentType,
    metadata: { cacheControl: "public, max-age=31536000" },
  });
  return `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${destination}`;
}

export async function deleteFromGCS(destination: string): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    // Try deleting local file
    try {
      await fs.unlink(
        path.join(process.cwd(), "public", "uploads", destination)
      );
    } catch {
      // ignore
    }
    return;
  }
  const bucket = await getGCSBucket();
  await bucket.file(destination).delete({ ignoreNotFound: true });
}
