-- CreateTable
CREATE TABLE "Mortgage" (
    "id" TEXT NOT NULL,
    "financialStepId" TEXT NOT NULL,
    "lender" TEXT,
    "balance" DECIMAL(10,2),
    "monthlyPayment" DECIMAL(10,2),
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mortgage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Mortgage_financialStepId_idx" ON "Mortgage"("financialStepId");

-- AddForeignKey
ALTER TABLE "Mortgage" ADD CONSTRAINT "Mortgage_financialStepId_fkey" FOREIGN KEY ("financialStepId") REFERENCES "FinancialStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
