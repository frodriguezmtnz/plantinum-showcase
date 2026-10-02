-- CreateTable
CREATE TABLE "MonthlyResult" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "votes" INTEGER NOT NULL,
    "platinumId" TEXT,
    "gameName" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageHint" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "isSpoiler" BOOLEAN NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthlyResult_period_votes_idx" ON "MonthlyResult"("period", "votes");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyResult_period_rank_key" ON "MonthlyResult"("period", "rank");
