-- AlterTable: Club daily rate
ALTER TABLE "Club" ADD COLUMN "dailyRate" DOUBLE PRECISION;

-- Backfill dailyRate from price where priceNote indicates per-day pricing
UPDATE "Club"
SET "dailyRate" = "price"
WHERE "price" IS NOT NULL
  AND (
    "priceNote" ILIKE '%per day%'
    OR "priceNote" ILIKE '%/ day%'
  );

-- AlterTable: PlannedClub booking fields
ALTER TABLE "PlannedClub" ADD COLUMN "bookedDates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "PlannedClub" ADD COLUMN "dailyRateOverride" DOUBLE PRECISION;
ALTER TABLE "PlannedClub" ADD COLUMN "totalPriceOverride" DOUBLE PRECISION;
