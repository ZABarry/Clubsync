-- UserRole: ADMIN -> MASTER_ADMIN, add REVIEWER
CREATE TYPE "UserRole_new" AS ENUM ('PARENT', 'REVIEWER', 'MASTER_ADMIN');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING (
  CASE
    WHEN "role"::text = 'ADMIN' THEN 'MASTER_ADMIN'::"UserRole_new"
    ELSE "role"::text::"UserRole_new"
  END
);
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'PARENT';

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- User audit fields
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "roleUpdatedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "roleUpdatedById" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_roleUpdatedById_fkey" FOREIGN KEY ("roleUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ParentProfile name fields
ALTER TABLE "ParentProfile" ADD COLUMN "firstName" TEXT;
ALTER TABLE "ParentProfile" ADD COLUMN "lastName" TEXT;

-- Club promotion fields
CREATE TYPE "ClubPromotionStatus" AS ENUM ('OFFICIAL', 'LOCAL', 'PENDING', 'DENIED');

ALTER TABLE "Club" ADD COLUMN "ownerParentProfileId" TEXT;
ALTER TABLE "Club" ADD COLUMN "promotionStatus" "ClubPromotionStatus" NOT NULL DEFAULT 'OFFICIAL';
ALTER TABLE "Club" ADD COLUMN "submissionNote" TEXT;
ALTER TABLE "Club" ADD COLUMN "reviewNote" TEXT;
ALTER TABLE "Club" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Club" ADD COLUMN "reviewedByUserId" TEXT;

ALTER TABLE "Club" ADD CONSTRAINT "Club_ownerParentProfileId_fkey" FOREIGN KEY ("ownerParentProfileId") REFERENCES "ParentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Club" ADD CONSTRAINT "Club_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Club_ownerParentProfileId_idx" ON "Club"("ownerParentProfileId");
CREATE INDEX "Club_promotionStatus_idx" ON "Club"("promotionStatus");

-- Notifications
CREATE TYPE "NotificationType" AS ENUM ('CLUB_SUBMITTED', 'CLUB_APPROVED', 'CLUB_DENIED');

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- Drop deprecated ClubSubmission
DROP TABLE IF EXISTS "ClubSubmission";
