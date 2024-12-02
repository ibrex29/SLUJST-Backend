/*
  Warnings:

  - Added the required column `issue` to the `Publication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `volume` to the `Publication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Publication" ADD COLUMN     "issue" TEXT NOT NULL,
ADD COLUMN     "volume" TEXT NOT NULL;
