-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "officerLatitude" DOUBLE PRECISION,
ADD COLUMN     "officerLocationUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "officerLongitude" DOUBLE PRECISION;
