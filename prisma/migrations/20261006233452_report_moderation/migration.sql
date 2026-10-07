-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PUBLISHED', 'UNDER_REVIEW', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SEXUAL', 'VIOLENT', 'OFF_CONTEXT', 'SPAM', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'ACTIONED', 'DISMISSED');

-- AlterTable
ALTER TABLE "Platinum" ADD COLUMN     "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PUBLISHED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "platinumId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "message" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_platinumId_idx" ON "Report"("platinumId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_userId_platinumId_key" ON "Report"("userId", "platinumId");

-- CreateIndex
CREATE INDEX "Platinum_moderationStatus_idx" ON "Platinum"("moderationStatus");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_platinumId_fkey" FOREIGN KEY ("platinumId") REFERENCES "Platinum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
