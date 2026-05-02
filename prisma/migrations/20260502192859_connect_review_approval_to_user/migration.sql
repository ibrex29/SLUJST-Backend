/*
  Warnings:

  - You are about to drop the column `approvedByEditorId` on the `Review` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_approvedByEditorId_fkey";

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "approvedByEditorId",
ADD COLUMN     "approvedByUserId" TEXT,
ADD COLUMN     "editorId" TEXT;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "Editor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
