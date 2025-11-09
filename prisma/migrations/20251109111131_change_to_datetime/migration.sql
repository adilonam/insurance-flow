/*
  Warnings:

  - The `dateMovedIn` column on the `InitialAssessment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `dateOfBirth` column on the `InitialAssessment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `dlIssue` column on the `InitialAssessment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `dlExpiry` column on the `InitialAssessment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `dateOfAccident` column on the `InitialAssessment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `dateLicenceObtained` column on the `InitialAssessment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `ukResidentSince` column on the `InitialAssessment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "InitialAssessment" DROP COLUMN "dateMovedIn",
ADD COLUMN     "dateMovedIn" TIMESTAMP(3),
DROP COLUMN "dateOfBirth",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
DROP COLUMN "dlIssue",
ADD COLUMN     "dlIssue" TIMESTAMP(3),
DROP COLUMN "dlExpiry",
ADD COLUMN     "dlExpiry" TIMESTAMP(3),
DROP COLUMN "dateOfAccident",
ADD COLUMN     "dateOfAccident" TIMESTAMP(3),
DROP COLUMN "dateLicenceObtained",
ADD COLUMN     "dateLicenceObtained" TIMESTAMP(3),
DROP COLUMN "ukResidentSince",
ADD COLUMN     "ukResidentSince" TIMESTAMP(3);
