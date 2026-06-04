-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MERCADO_PAGO', 'MOCK');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'MOCK',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount_cents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "name" VARCHAR(150) NOT NULL,
    "nickname" VARCHAR(80),
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "access_code" VARCHAR(60) NOT NULL,
    "provider_payment_id" VARCHAR(120),
    "provider_status" VARCHAR(80),
    "provider_status_detail" VARCHAR(120),
    "qr_code" TEXT,
    "qr_code_base64" TEXT,
    "ticket_url" TEXT,
    "raw_provider_response" JSONB,
    "paid_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_access_code_key" ON "payments"("access_code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_payment_id_key" ON "payments"("provider_payment_id");

-- CreateIndex
CREATE INDEX "payments_email_idx" ON "payments"("email");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");
