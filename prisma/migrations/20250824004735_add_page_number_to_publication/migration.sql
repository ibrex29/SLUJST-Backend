-- AlterTable
ALTER TABLE "Author" ADD COLUMN     "higestQualification" TEXT,
ADD COLUMN     "reviewInterest" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "Publication" ADD COLUMN     "pageRange" TEXT;

-- AlterTable
ALTER TABLE "Reviewer" ADD COLUMN     "higestQualification" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phoneNumber" TEXT;
