/*
  Warnings:

  - You are about to drop the column `createdBy` on the `Publication` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `Publication` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Publication" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy",
ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "updatedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
