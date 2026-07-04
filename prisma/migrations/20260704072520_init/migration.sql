-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PARENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "CampStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('SOUTH_WEST_LONDON');

-- CreateEnum
CREATE TYPE "PlannedCampStatus" AS ENUM ('SUGGESTED', 'INTERESTED', 'FAVOURITE', 'PLANNED', 'BOOKED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED');

-- CreateEnum
CREATE TYPE "SharedCampParticipantStatus" AS ENUM ('INTERESTED', 'PLANNED', 'BOOKED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PARENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "homePostcode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "defaultSearchRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL,
    "parentProfileId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "schoolYear" TEXT,
    "interests" TEXT[],
    "availabilityStart" TIMESTAMP(3),
    "availabilityEnd" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "contactEmail" TEXT,
    "phone" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camp" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "locationName" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "activities" TEXT[],
    "ageMin" INTEGER NOT NULL,
    "ageMax" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "dailyStartTime" TEXT,
    "dailyEndTime" TEXT,
    "price" DOUBLE PRECISION,
    "bookingUrl" TEXT,
    "imageUrl" TEXT,
    "ratingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "status" "CampStatus" NOT NULL DEFAULT 'ACTIVE',
    "region" "Region" NOT NULL DEFAULT 'SOUTH_WEST_LONDON',
    "isIndoor" BOOLEAN NOT NULL DEFAULT false,
    "isOutdoor" BOOLEAN NOT NULL DEFAULT true,
    "sendFriendly" BOOLEAN NOT NULL DEFAULT false,
    "accessibilityNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Camp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedCamp" (
    "id" TEXT NOT NULL,
    "parentProfileId" TEXT NOT NULL,
    "childProfileId" TEXT,
    "campId" TEXT NOT NULL,
    "status" "PlannedCampStatus" NOT NULL DEFAULT 'INTERESTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannedCamp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustedParentConnection" (
    "id" TEXT NOT NULL,
    "requesterParentId" TEXT NOT NULL,
    "recipientParentId" TEXT,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "inviteToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "TrustedParentConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedCamp" (
    "id" TEXT NOT NULL,
    "campId" TEXT NOT NULL,
    "createdByParentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedCamp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedCampParticipant" (
    "id" TEXT NOT NULL,
    "sharedCampId" TEXT NOT NULL,
    "parentProfileId" TEXT NOT NULL,
    "childProfileId" TEXT,
    "plannedCampId" TEXT,
    "status" "SharedCampParticipantStatus" NOT NULL DEFAULT 'INTERESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedCampParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "campId" TEXT NOT NULL,
    "parentProfileId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewText" TEXT,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampSubmission" (
    "id" TEXT NOT NULL,
    "submittedByParentId" TEXT NOT NULL,
    "campName" TEXT NOT NULL,
    "providerName" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampChangeRequest" (
    "id" TEXT NOT NULL,
    "campId" TEXT NOT NULL,
    "submittedByParentId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "suggestedValue" TEXT NOT NULL,
    "notes" TEXT,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ParentProfile_userId_key" ON "ParentProfile"("userId");

-- CreateIndex
CREATE INDEX "Camp_latitude_longitude_idx" ON "Camp"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Camp_startDate_endDate_idx" ON "Camp"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Camp_providerId_idx" ON "Camp"("providerId");

-- CreateIndex
CREATE INDEX "PlannedCamp_campId_idx" ON "PlannedCamp"("campId");

-- CreateIndex
CREATE INDEX "PlannedCamp_parentProfileId_idx" ON "PlannedCamp"("parentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "PlannedCamp_parentProfileId_campId_childProfileId_key" ON "PlannedCamp"("parentProfileId", "campId", "childProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "TrustedParentConnection_inviteToken_key" ON "TrustedParentConnection"("inviteToken");

-- CreateIndex
CREATE INDEX "TrustedParentConnection_requesterParentId_idx" ON "TrustedParentConnection"("requesterParentId");

-- CreateIndex
CREATE INDEX "TrustedParentConnection_recipientParentId_idx" ON "TrustedParentConnection"("recipientParentId");

-- CreateIndex
CREATE INDEX "Rating_campId_idx" ON "Rating"("campId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_campId_parentProfileId_key" ON "Rating"("campId", "parentProfileId");

-- AddForeignKey
ALTER TABLE "ParentProfile" ADD CONSTRAINT "ParentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camp" ADD CONSTRAINT "Camp_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedCamp" ADD CONSTRAINT "PlannedCamp_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedCamp" ADD CONSTRAINT "PlannedCamp_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedCamp" ADD CONSTRAINT "PlannedCamp_campId_fkey" FOREIGN KEY ("campId") REFERENCES "Camp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustedParentConnection" ADD CONSTRAINT "TrustedParentConnection_requesterParentId_fkey" FOREIGN KEY ("requesterParentId") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustedParentConnection" ADD CONSTRAINT "TrustedParentConnection_recipientParentId_fkey" FOREIGN KEY ("recipientParentId") REFERENCES "ParentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCamp" ADD CONSTRAINT "SharedCamp_campId_fkey" FOREIGN KEY ("campId") REFERENCES "Camp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCamp" ADD CONSTRAINT "SharedCamp_createdByParentId_fkey" FOREIGN KEY ("createdByParentId") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCampParticipant" ADD CONSTRAINT "SharedCampParticipant_sharedCampId_fkey" FOREIGN KEY ("sharedCampId") REFERENCES "SharedCamp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCampParticipant" ADD CONSTRAINT "SharedCampParticipant_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCampParticipant" ADD CONSTRAINT "SharedCampParticipant_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCampParticipant" ADD CONSTRAINT "SharedCampParticipant_plannedCampId_fkey" FOREIGN KEY ("plannedCampId") REFERENCES "PlannedCamp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_campId_fkey" FOREIGN KEY ("campId") REFERENCES "Camp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampSubmission" ADD CONSTRAINT "CampSubmission_submittedByParentId_fkey" FOREIGN KEY ("submittedByParentId") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampChangeRequest" ADD CONSTRAINT "CampChangeRequest_campId_fkey" FOREIGN KEY ("campId") REFERENCES "Camp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampChangeRequest" ADD CONSTRAINT "CampChangeRequest_submittedByParentId_fkey" FOREIGN KEY ("submittedByParentId") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
