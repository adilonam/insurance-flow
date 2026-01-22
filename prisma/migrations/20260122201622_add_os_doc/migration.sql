-- CreateTable
CREATE TABLE "OffboardingStep" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OffboardingStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffboardingDocument" (
    "id" TEXT NOT NULL,
    "offboardingStepId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileKey" TEXT,
    "fileName" TEXT,
    "uploadedAt" TIMESTAMP(3),
    "isExcluded" BOOLEAN NOT NULL DEFAULT false,
    "excludedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OffboardingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OffboardingStep_claimId_key" ON "OffboardingStep"("claimId");

-- CreateIndex
CREATE INDEX "OffboardingDocument_offboardingStepId_idx" ON "OffboardingDocument"("offboardingStepId");

-- CreateIndex
CREATE INDEX "OffboardingDocument_documentType_idx" ON "OffboardingDocument"("documentType");

-- AddForeignKey
ALTER TABLE "OffboardingStep" ADD CONSTRAINT "OffboardingStep_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffboardingDocument" ADD CONSTRAINT "OffboardingDocument_offboardingStepId_fkey" FOREIGN KEY ("offboardingStepId") REFERENCES "OffboardingStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
