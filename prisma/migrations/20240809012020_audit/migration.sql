/*
  Warnings:

  - Added the required column `createdBy` to the `Publication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isActive` to the `Publication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Publication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `Publication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `Reply` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Reply` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `Reply` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isClosed` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `Section` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Publication" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Reply" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "isClosed" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedBy" TEXT NOT NULL;
