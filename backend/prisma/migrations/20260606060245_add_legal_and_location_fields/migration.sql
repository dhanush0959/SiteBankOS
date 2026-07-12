-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "isBankLoanAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lpNumber" TEXT,
ADD COLUMN     "reraId" TEXT;
