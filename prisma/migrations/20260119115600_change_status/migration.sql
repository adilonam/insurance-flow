/*
  Warnings:

  - The values [ACCEPTED,REJECTED,IN_PROGRESS_SERVICES,IN_PROGRESS_REPAIRS,PENDING_OFFBOARDING,PENDING_OFFBOARDING_NONCOOPERATIVE,PAYMENT_PACK_PREPARATION,AWAITING_FINAL_PAYMENT,CLOSED] on the enum `ClaimStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ClaimStatus_new" AS ENUM ('PENDING_TRIAGE', 'PENDING_FINANCIAL', 'PENDING_LIVE_CLAIMS', 'PENDING_OS_DOCS', 'PENDING_PAYMENT_PACK_REVIEW', 'PENDING_SENT_TO_TP', 'PENDING_SENT_TO_SOLS', 'PENDING_ISSUED');
ALTER TABLE "Claim" ALTER COLUMN "status" TYPE "ClaimStatus_new" USING ("status"::text::"ClaimStatus_new");
ALTER TYPE "ClaimStatus" RENAME TO "ClaimStatus_old";
ALTER TYPE "ClaimStatus_new" RENAME TO "ClaimStatus";
DROP TYPE "public"."ClaimStatus_old";
COMMIT;
