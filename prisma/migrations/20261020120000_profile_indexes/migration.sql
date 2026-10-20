-- CreateIndex
CREATE INDEX "Platinum_userId_platinumDate_idx" ON "Platinum"("userId", "platinumDate" DESC);

-- CreateIndex
CREATE INDEX "Platinum_userId_moderationStatus_platinumDate_idx" ON "Platinum"("userId", "moderationStatus", "platinumDate" DESC);
