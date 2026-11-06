-- AlterEnum
ALTER TYPE "EmailTokenKind" ADD VALUE 'EMAIL_CHANGE';

-- AlterTable
ALTER TABLE "EmailToken" ADD COLUMN     "pendingEmail" TEXT;
