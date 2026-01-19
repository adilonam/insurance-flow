/*
  Warnings:

  - You are about to drop the column `additionalDriverDob` on the `Claim` table. All the data in the column will be lost.
  - You are about to drop the column `additionalDriverMobile` on the `Claim` table. All the data in the column will be lost.
  - You are about to drop the column `additionalDriverName` on the `Claim` table. All the data in the column will be lost.
  - You are about to drop the column `additionalDriverPostCode` on the `Claim` table. All the data in the column will be lost.
  - You are about to drop the column `tpiInsurerContact` on the `Claim` table. All the data in the column will be lost.
  - You are about to drop the column `tpiInsurerName` on the `Claim` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Claim" DROP COLUMN "additionalDriverDob",
DROP COLUMN "additionalDriverMobile",
DROP COLUMN "additionalDriverName",
DROP COLUMN "additionalDriverPostCode",
DROP COLUMN "tpiInsurerContact",
DROP COLUMN "tpiInsurerName";
