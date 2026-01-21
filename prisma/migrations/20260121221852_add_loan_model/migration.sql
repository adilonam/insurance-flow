-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "financialStepId" TEXT NOT NULL,
    "lender" TEXT,
    "balance" DECIMAL(10,2),
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Loan_financialStepId_idx" ON "Loan"("financialStepId");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_financialStepId_fkey" FOREIGN KEY ("financialStepId") REFERENCES "FinancialStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
