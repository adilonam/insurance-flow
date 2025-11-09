-- CreateEnum
CREATE TYPE "ServiceProviderType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('DIRECT', 'BROKER', 'INSURER', 'BODYSHOP', 'DEALERSHIP', 'FLEET');

-- CreateTable
CREATE TABLE "ServiceProvider" (
    "id" TEXT NOT NULL,
    "type" "ServiceProviderType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "type" "PartnerType" NOT NULL,
    "vehicle_recovery_id" TEXT,
    "vehicle_storage_id" TEXT,
    "replacement_hire_id" TEXT,
    "vehicle_repairs_id" TEXT,
    "independent_engineer_id" TEXT,
    "vehicle_inspection_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_vehicle_recovery_id_fkey" FOREIGN KEY ("vehicle_recovery_id") REFERENCES "ServiceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_vehicle_storage_id_fkey" FOREIGN KEY ("vehicle_storage_id") REFERENCES "ServiceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_replacement_hire_id_fkey" FOREIGN KEY ("replacement_hire_id") REFERENCES "ServiceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_vehicle_repairs_id_fkey" FOREIGN KEY ("vehicle_repairs_id") REFERENCES "ServiceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_independent_engineer_id_fkey" FOREIGN KEY ("independent_engineer_id") REFERENCES "ServiceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_vehicle_inspection_id_fkey" FOREIGN KEY ("vehicle_inspection_id") REFERENCES "ServiceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
