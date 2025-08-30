-- DropIndex
DROP INDEX "Publication_title_abstract_keywords_Authors_idx";

-- CreateIndex
CREATE INDEX "Publication_title_idx" ON "Publication"("title");
