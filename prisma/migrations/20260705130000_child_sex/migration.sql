-- CreateEnum
CREATE TYPE "ChildSex" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "ChildProfile" ADD COLUMN "sex" "ChildSex";
