-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('INITIAL_ASSESSMENT', 'ACCIDENT_IMAGES', 'CLIENT_ID_PROOF_OF_ADDRESS', 'CLIENT_VEHICLE_DOCUMENTS', 'AUTHORISATION_MITIGATION_STATEMENT', 'ISAGI_CHECK', 'THREE_MONTHS_BANK_STATEMENTS', 'ASKMID_SEARCH', 'DVLA_LICENCE_CHECK', 'HIRE_VEHICLE_DOCUMENTS', 'HSR_AGREEMENTS', 'PERMISSION_LETTER', 'STRIPE_DETAILS', 'DAMAGE_CHECKLIST', 'CLIENT_QUESTIONNAIRES', 'OFFBOARDING', 'BHR_REPORT', 'CANFORD_LAW_SETUP', 'NON_CO_OPERATIVE_CLIENT');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'INITIAL_ASSESSMENT',
    "priority" "CasePriority" NOT NULL DEFAULT 'MEDIUM',
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Case_caseId_key" ON "Case"("caseId");

-- CreateIndex
CREATE INDEX "Case_caseId_idx" ON "Case"("caseId");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "Case_priority_idx" ON "Case"("priority");

-- CreateIndex
CREATE INDEX "Case_assignedTo_idx" ON "Case"("assignedTo");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
