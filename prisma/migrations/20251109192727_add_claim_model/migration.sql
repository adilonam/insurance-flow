-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('FAULT', 'NON_FAULT');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING_TRIAGE', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS_SERVICES', 'IN_PROGRESS_REPAIRS', 'PENDING_OFFBOARDING', 'PENDING_OFFBOARDING_NONCOOPERATIVE', 'PAYMENT_PACK_PREPARATION', 'AWAITING_FINAL_PAYMENT', 'CLOSED');

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "dateOfAccident" TIMESTAMP(3) NOT NULL,
    "type" "ClaimType" NOT NULL,
    "status" "ClaimStatus" NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientMobile" TEXT NOT NULL,
    "clientDob" TIMESTAMP(3) NOT NULL,
    "clientPostCode" TEXT NOT NULL,
    "additionalDriverName" TEXT,
    "additionalDriverMobile" TEXT,
    "additionalDriverDob" TIMESTAMP(3),
    "additionalDriverPostCode" TEXT,
    "tpiInsurerName" TEXT,
    "tpiInsurerContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);
