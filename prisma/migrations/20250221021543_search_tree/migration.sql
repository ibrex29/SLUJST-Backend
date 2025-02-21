-- CreateIndex
CREATE INDEX "Publication_title_abstract_keywords_idx" ON "Publication"("title", "abstract", "keywords");
