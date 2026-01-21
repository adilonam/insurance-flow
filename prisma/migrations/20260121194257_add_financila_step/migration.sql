-- CreateTable
CREATE TABLE "FinancialStep" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "financialStepId" TEXT NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountType" TEXT,
    "balance" DECIMAL(10,2),
    "overdraftUsed" DECIMAL(10,2),
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialStep_claimId_key" ON "FinancialStep"("claimId");

-- CreateIndex
CREATE INDEX "BankAccount_financialStepId_idx" ON "BankAccount"("financialStepId");

-- AddForeignKey
ALTER TABLE "FinancialStep" ADD CONSTRAINT "FinancialStep_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_financialStepId_fkey" FOREIGN KEY ("financialStepId") REFERENCES "FinancialStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
