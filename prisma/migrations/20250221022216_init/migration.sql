-- DropIndex
DROP INDEX "Publication_title_abstract_keywords_idx";

-- AlterTable
ALTER TABLE "Publication" ADD COLUMN     "Authors" TEXT[];

-- CreateIndex
CREATE INDEX "Publication_title_abstract_keywords_Authors_idx" ON "Publication"("title", "abstract", "keywords", "Authors");
