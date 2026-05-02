-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'VISIBLE_TO_AUTHOR', 'REJECTED_BY_EDITOR', 'RETURNED_TO_REVIEWER');

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_authorId_fkey";

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
ADD COLUMN     "uploadedFileUrl" TEXT,
ALTER COLUMN "reviewDate" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "recommendation" DROP NOT NULL,
ALTER COLUMN "authorId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "Review"("status");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_approvedByEditorId_fkey" FOREIGN KEY ("approvedByEditorId") REFERENCES "Editor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;
