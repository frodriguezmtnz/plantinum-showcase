-- AlterTable
-- Newest TOTP timestep already consumed; codes from earlier or equal
-- timesteps are rejected (one-shot codes, replay prevention).
ALTER TABLE "User" ADD COLUMN "lastUsedTotpTimestep" INTEGER;
