-- AlterEnum
ALTER TYPE "NotificationKind" ADD VALUE 'FOLLOWED_PLATE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyFollowedUploads" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_id_idx" ON "Notification"("userId", "createdAt", "id");
