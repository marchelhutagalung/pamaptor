-- AlterEnum
ALTER TYPE "PostStatus" ADD VALUE 'INFORMASI';

-- CreateIndex
CREATE INDEX "Post_isDeleted_isPinned_createdAt_idx" ON "Post"("isDeleted", "isPinned" DESC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Post_userId_isDeleted_createdAt_idx" ON "Post"("userId", "isDeleted", "createdAt" DESC);
