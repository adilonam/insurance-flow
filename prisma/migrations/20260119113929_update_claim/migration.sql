/*
  Warnings:

  - Added the required column `accidentCircumstances` to the `Claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accidentLocation` to the `Claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isVehicleDrivable` to the `Claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicleRegistration` to the `Claim` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Claim" DROP CONSTRAINT "Claim_partnerId_fkey";

-- AlterTable
ALTER TABLE "Claim" ADD COLUMN     "accidentCircumstances" TEXT NOT NULL,
ADD COLUMN     "accidentLocation" TEXT NOT NULL,
ADD COLUMN     "accidentTime" TEXT,
ADD COLUMN     "clientEmail" TEXT,
ADD COLUMN     "isPrivateHireDriver" TEXT,
ADD COLUMN     "isVehicleDrivable" TEXT NOT NULL,
ADD COLUMN     "thirdPartyContactNumber" TEXT,
ADD COLUMN     "thirdPartyName" TEXT,
ADD COLUMN     "thirdPartyVehicleRegistration" TEXT,
ADD COLUMN     "vehicleRegistration" TEXT NOT NULL,
ALTER COLUMN "partnerId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Partner_id_idx" ON "Partner"("id");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
