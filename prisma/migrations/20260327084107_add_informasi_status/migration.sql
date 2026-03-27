-- AlterEnum (idempotent)
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

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Post_isDeleted_isPinned_createdAt_idx" ON "Post"("isDeleted", "isPinned" DESC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Post_userId_isDeleted_createdAt_idx" ON "Post"("userId", "isDeleted", "createdAt" DESC);
