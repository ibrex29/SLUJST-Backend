-- CreateTable
CREATE TABLE "FeaturedPublication" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "featuredById" TEXT,
    "featuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "FeaturedPublication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedPublication_publicationId_key" ON "FeaturedPublication"("publicationId");

-- CreateIndex
CREATE INDEX "FeaturedPublication_priority_idx" ON "FeaturedPublication"("priority");

-- AddForeignKey
ALTER TABLE "FeaturedPublication" ADD CONSTRAINT "FeaturedPublication_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedPublication" ADD CONSTRAINT "FeaturedPublication_featuredById_fkey" FOREIGN KEY ("featuredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
