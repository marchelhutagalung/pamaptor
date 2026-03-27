-- Idempotent production migration script
-- Safe to run multiple times

-- Add INFORMASI to PostStatus enum (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'INFORMASI'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PostStatus')
  ) THEN
    ALTER TYPE "PostStatus" ADD VALUE 'INFORMASI';
  END IF;
END
$$;

-- Add officer location columns to Post (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Post' AND column_name = 'officerLatitude') THEN
    ALTER TABLE "Post" ADD COLUMN "officerLatitude" DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Post' AND column_name = 'officerLongitude') THEN
    ALTER TABLE "Post" ADD COLUMN "officerLongitude" DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Post' AND column_name = 'officerLocationUpdatedAt') THEN
    ALTER TABLE "Post" ADD COLUMN "officerLocationUpdatedAt" TIMESTAMP(3);
  END IF;
END
$$;

-- Create indexes (if not exists)
CREATE INDEX IF NOT EXISTS "Post_isDeleted_isPinned_createdAt_idx" ON "Post"("isDeleted", "isPinned" DESC, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Post_userId_isDeleted_createdAt_idx" ON "Post"("userId", "isDeleted", "createdAt" DESC);
