-- Rename Camp → Club across enums, tables, columns, indexes, and constraints.

-- Enums
ALTER TYPE "CampStatus" RENAME TO "ClubStatus";
ALTER TYPE "PlannedCampStatus" RENAME TO "PlannedClubStatus";
ALTER TYPE "SharedCampParticipantStatus" RENAME TO "SharedClubParticipantStatus";

-- Tables
ALTER TABLE "Camp" RENAME TO "Club";
ALTER TABLE "PlannedCamp" RENAME TO "PlannedClub";
ALTER TABLE "SharedCamp" RENAME TO "SharedClub";
ALTER TABLE "SharedCampParticipant" RENAME TO "SharedClubParticipant";
ALTER TABLE "CampSubmission" RENAME TO "ClubSubmission";
ALTER TABLE "CampChangeRequest" RENAME TO "ClubChangeRequest";

-- Columns
ALTER TABLE "PlannedClub" RENAME COLUMN "campId" TO "clubId";
ALTER TABLE "SharedClub" RENAME COLUMN "campId" TO "clubId";
ALTER TABLE "SharedClubParticipant" RENAME COLUMN "sharedCampId" TO "sharedClubId";
ALTER TABLE "SharedClubParticipant" RENAME COLUMN "plannedCampId" TO "plannedClubId";
ALTER TABLE "Rating" RENAME COLUMN "campId" TO "clubId";
ALTER TABLE "ClubSubmission" RENAME COLUMN "campName" TO "clubName";
ALTER TABLE "ClubChangeRequest" RENAME COLUMN "campId" TO "clubId";

-- Indexes on Club (formerly Camp)
ALTER INDEX "Camp_pkey" RENAME TO "Club_pkey";
ALTER INDEX "Camp_latitude_longitude_idx" RENAME TO "Club_latitude_longitude_idx";
ALTER INDEX "Camp_startDate_endDate_idx" RENAME TO "Club_startDate_endDate_idx";
ALTER INDEX "Camp_providerId_idx" RENAME TO "Club_providerId_idx";
ALTER INDEX "Camp_providerId_name_locationName_key" RENAME TO "Club_providerId_name_locationName_key";

-- Indexes on PlannedClub
ALTER INDEX "PlannedCamp_pkey" RENAME TO "PlannedClub_pkey";
ALTER INDEX "PlannedCamp_campId_idx" RENAME TO "PlannedClub_clubId_idx";
ALTER INDEX "PlannedCamp_parentProfileId_idx" RENAME TO "PlannedClub_parentProfileId_idx";
ALTER INDEX "PlannedCamp_parentProfileId_campId_childProfileId_key" RENAME TO "PlannedClub_parentProfileId_clubId_childProfileId_key";

-- Indexes on SharedClub
ALTER INDEX "SharedCamp_pkey" RENAME TO "SharedClub_pkey";

-- Indexes on SharedClubParticipant
ALTER INDEX "SharedCampParticipant_pkey" RENAME TO "SharedClubParticipant_pkey";

-- Indexes on Rating
ALTER INDEX "Rating_campId_idx" RENAME TO "Rating_clubId_idx";
ALTER INDEX "Rating_campId_parentProfileId_key" RENAME TO "Rating_clubId_parentProfileId_key";

-- Indexes on ClubSubmission / ClubChangeRequest
ALTER INDEX "CampSubmission_pkey" RENAME TO "ClubSubmission_pkey";
ALTER INDEX "CampChangeRequest_pkey" RENAME TO "ClubChangeRequest_pkey";

-- Foreign key constraints
ALTER TABLE "Club" RENAME CONSTRAINT "Camp_providerId_fkey" TO "Club_providerId_fkey";
ALTER TABLE "PlannedClub" RENAME CONSTRAINT "PlannedCamp_parentProfileId_fkey" TO "PlannedClub_parentProfileId_fkey";
ALTER TABLE "PlannedClub" RENAME CONSTRAINT "PlannedCamp_childProfileId_fkey" TO "PlannedClub_childProfileId_fkey";
ALTER TABLE "PlannedClub" RENAME CONSTRAINT "PlannedCamp_campId_fkey" TO "PlannedClub_clubId_fkey";
ALTER TABLE "SharedClub" RENAME CONSTRAINT "SharedCamp_campId_fkey" TO "SharedClub_clubId_fkey";
ALTER TABLE "SharedClub" RENAME CONSTRAINT "SharedCamp_createdByParentId_fkey" TO "SharedClub_createdByParentId_fkey";
ALTER TABLE "SharedClubParticipant" RENAME CONSTRAINT "SharedCampParticipant_sharedCampId_fkey" TO "SharedClubParticipant_sharedClubId_fkey";
ALTER TABLE "SharedClubParticipant" RENAME CONSTRAINT "SharedCampParticipant_parentProfileId_fkey" TO "SharedClubParticipant_parentProfileId_fkey";
ALTER TABLE "SharedClubParticipant" RENAME CONSTRAINT "SharedCampParticipant_childProfileId_fkey" TO "SharedClubParticipant_childProfileId_fkey";
ALTER TABLE "SharedClubParticipant" RENAME CONSTRAINT "SharedCampParticipant_plannedCampId_fkey" TO "SharedClubParticipant_plannedClubId_fkey";
ALTER TABLE "Rating" RENAME CONSTRAINT "Rating_campId_fkey" TO "Rating_clubId_fkey";
ALTER TABLE "ClubSubmission" RENAME CONSTRAINT "CampSubmission_submittedByParentId_fkey" TO "ClubSubmission_submittedByParentId_fkey";
ALTER TABLE "ClubChangeRequest" RENAME CONSTRAINT "CampChangeRequest_campId_fkey" TO "ClubChangeRequest_clubId_fkey";
ALTER TABLE "ClubChangeRequest" RENAME CONSTRAINT "CampChangeRequest_submittedByParentId_fkey" TO "ClubChangeRequest_submittedByParentId_fkey";
