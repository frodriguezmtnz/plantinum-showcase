-- CreateEnum
CREATE TYPE "ReviewReason" AS ENUM ('SCREENING', 'AI_REVIEW', 'AI_UNSAFE', 'SCREEN_FAILED', 'NO_SCREENING');

-- AlterTable
ALTER TABLE "Platinum" ADD COLUMN "reviewReason" "ReviewReason";

-- Backfill the queue as it stands today: a plate under review with a cached
-- verdict is waiting on a human for that verdict; without one, screening either
-- failed or was never configured, which is also a human's call.
UPDATE "Platinum" p
SET "reviewReason" = CASE
  WHEN v."label" = 'UNSAFE' THEN 'AI_UNSAFE'::"ReviewReason"
  ELSE 'AI_REVIEW'::"ReviewReason"
END
FROM "ImageVerdict" v
WHERE p."hash" = v."hash"
  AND p."moderationStatus" = 'UNDER_REVIEW';

UPDATE "Platinum"
SET "reviewReason" = 'SCREEN_FAILED'
WHERE "moderationStatus" = 'UNDER_REVIEW'
  AND "reviewReason" IS NULL;
