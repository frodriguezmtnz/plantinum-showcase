-- AlterTable
ALTER TABLE "Platinum" ADD COLUMN "gameId" INTEGER;

-- CreateIndex
CREATE INDEX "Platinum_gameId_idx" ON "Platinum"("gameId");
