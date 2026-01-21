-- CreateTable
CREATE TABLE "HirePurchaseAgreement" (
    "id" TEXT NOT NULL,
    "financialStepId" TEXT NOT NULL,
    "lender" TEXT,
    "balance" DECIMAL(10,2),
    "monthlyPayment" DECIMAL(10,2),
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HirePurchaseAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HirePurchaseAgreement_financialStepId_idx" ON "HirePurchaseAgreement"("financialStepId");

-- AddForeignKey
ALTER TABLE "HirePurchaseAgreement" ADD CONSTRAINT "HirePurchaseAgreement_financialStepId_fkey" FOREIGN KEY ("financialStepId") REFERENCES "FinancialStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
