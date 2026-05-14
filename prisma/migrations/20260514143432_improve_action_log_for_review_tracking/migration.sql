/*
  Warnings:

  - Added the required column `action` to the `ActionLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('REVIEW_CREATED', 'REVIEW_UPDATED', 'REVIEW_COMPLETED', 'REVIEW_APPROVED', 'REVIEW_REJECTED', 'MANUSCRIPT_ASSIGNED');

-- AlterTable
ALTER TABLE "ActionLog" ADD COLUMN     "action" "ActionType" NOT NULL,
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "commentsForEditors" TEXT,
ALTER COLUMN "recommendation" DROP NOT NULL;

-- AlterTable
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_RolePermissions_AB_unique";

-- AlterTable
ALTER TABLE "_UserRoles" ADD CONSTRAINT "_UserRoles_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_UserRoles_AB_unique";
