-- AlterTable
ALTER TABLE "Provider" ADD COLUMN "slug" TEXT,
ADD COLUMN "sourceUrl" TEXT;

-- AlterTable
ALTER TABLE "Camp" ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "endDate" DROP NOT NULL,
ADD COLUMN "priceNote" TEXT,
ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "dataConfidence" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Provider_slug_key" ON "Provider"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Camp_providerId_name_locationName_key" ON "Camp"("providerId", "name", "locationName");
