-- AlterTable
ALTER TABLE "Platinum" ADD COLUMN     "monthlyVotesMonth" TEXT;

-- Backfill: keep existing monthly counters attributed to the current month.
UPDATE "Platinum"
SET "monthlyVotesMonth" = to_char(
  now() AT TIME ZONE 'Europe/Madrid',
  'YYYY-MM'
)
WHERE "monthlyVotes" > 0;

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "platinumId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vote_platinumId_idx" ON "Vote"("platinumId");

-- CreateIndex
CREATE INDEX "Vote_platinumId_period_idx" ON "Vote"("platinumId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_platinumId_key" ON "Vote"("userId", "platinumId");

-- CreateIndex
CREATE INDEX "Platinum_monthlyVotesMonth_monthlyVotes_idx" ON "Platinum"("monthlyVotesMonth", "monthlyVotes");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_platinumId_fkey" FOREIGN KEY ("platinumId") REFERENCES "Platinum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
