-- Migrate existing PAID rows to BOOKED before removing the enum value
UPDATE "PlannedClub" SET status = 'BOOKED' WHERE status = 'PAID';
UPDATE "SharedClubParticipant" SET status = 'BOOKED' WHERE status = 'PAID';

-- Recreate PlannedClubStatus without PAID
ALTER TYPE "PlannedClubStatus" RENAME TO "PlannedClubStatus_old";
CREATE TYPE "PlannedClubStatus" AS ENUM ('SUGGESTED', 'INTERESTED', 'FAVOURITE', 'PLANNED', 'BOOKED', 'CANCELLED');
ALTER TABLE "PlannedClub" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "PlannedClub" ALTER COLUMN "status" TYPE "PlannedClubStatus" USING ("status"::text::"PlannedClubStatus");
ALTER TABLE "PlannedClub" ALTER COLUMN "status" SET DEFAULT 'INTERESTED';
DROP TYPE "PlannedClubStatus_old";

-- Recreate SharedClubParticipantStatus without PAID
ALTER TYPE "SharedClubParticipantStatus" RENAME TO "SharedClubParticipantStatus_old";
CREATE TYPE "SharedClubParticipantStatus" AS ENUM ('INTERESTED', 'PLANNED', 'BOOKED', 'CANCELLED');
ALTER TABLE "SharedClubParticipant" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "SharedClubParticipant" ALTER COLUMN "status" TYPE "SharedClubParticipantStatus" USING ("status"::text::"SharedClubParticipantStatus");
ALTER TABLE "SharedClubParticipant" ALTER COLUMN "status" SET DEFAULT 'INTERESTED';
DROP TYPE "SharedClubParticipantStatus_old";
