-- CreateTable
CREATE TABLE "SuggestedReviewer" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "affiliation" TEXT,
    "manuscriptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuggestedReviewer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SuggestedReviewer_manuscriptId_idx" ON "SuggestedReviewer"("manuscriptId");

-- AddForeignKey
ALTER TABLE "SuggestedReviewer" ADD CONSTRAINT "SuggestedReviewer_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "Manuscript"("id") ON DELETE CASCADE ON UPDATE CASCADE;
