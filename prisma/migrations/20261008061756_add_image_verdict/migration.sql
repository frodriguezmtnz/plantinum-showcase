-- CreateEnum
CREATE TYPE "AiVerdictLabel" AS ENUM ('SAFE', 'REVIEW', 'UNSAFE');

-- CreateTable
CREATE TABLE "ImageVerdict" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "label" "AiVerdictLabel" NOT NULL,
    "category" TEXT,
    "confidence" DOUBLE PRECISION,
    "summary" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageVerdict_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImageVerdict_hash_key" ON "ImageVerdict"("hash");
