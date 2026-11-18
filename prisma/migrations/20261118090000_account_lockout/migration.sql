-- AlterTable
-- Persistent brute-force lockout: failed password attempts accumulate
-- across rate-limit windows and lock the account with progressive backoff.
ALTER TABLE "User" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lockedUntil" TIMESTAMP(3);
