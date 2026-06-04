-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'ASAAS';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "document" VARCHAR(20),
ADD COLUMN     "provider_customer_id" VARCHAR(120);
