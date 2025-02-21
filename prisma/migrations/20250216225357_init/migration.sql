-- DropForeignKey
ALTER TABLE "Manuscript" DROP CONSTRAINT "Manuscript_authorId_fkey";

-- AlterTable
ALTER TABLE "Manuscript" ALTER COLUMN "authorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Manuscript" ADD CONSTRAINT "Manuscript_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;
