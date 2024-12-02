/*
  Warnings:

  - You are about to drop the column `manuscriptLink` on the `Manuscript` table. All the data in the column will be lost.
  - You are about to drop the column `otherDocsLink` on the `Manuscript` table. All the data in the column will be lost.
  - You are about to drop the column `proofofPayment` on the `Manuscript` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Manuscript" DROP COLUMN "manuscriptLink",
DROP COLUMN "otherDocsLink",
DROP COLUMN "proofofPayment";

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "manuscriptLink" TEXT NOT NULL,
    "proofofPayment" TEXT NOT NULL,
    "otherDocsLink" TEXT,
    "manuscriptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "Manuscript"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
