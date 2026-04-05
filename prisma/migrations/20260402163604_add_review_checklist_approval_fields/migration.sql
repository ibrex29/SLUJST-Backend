-- CreateEnum
CREATE TYPE "ChecklistValue" AS ENUM ('YES', 'CAN_BE_IMPROVED', 'MUST_BE_IMPROVED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "EnglishQuality" AS ENUM ('NEEDS_IMPROVEMENT', 'FINE');

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "aiDeclarationConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedByEditorId" TEXT,
ADD COLUMN     "checklist" JSONB,
ADD COLUMN     "commentsForEditors" TEXT,
ADD COLUMN     "notifyOnFinalStatus" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "comments" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Review_canAuthorView_idx" ON "Review"("canAuthorView");
