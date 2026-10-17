-- AlterEnum
ALTER TYPE "ReportReason" ADD VALUE 'APPEAL';

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('PLATE_HIDDEN', 'PLATE_UNDER_REVIEW', 'APPEAL_RESOLVED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "strikes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "FlaggedHash" (
    "hash" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlaggedHash_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "platinumId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
