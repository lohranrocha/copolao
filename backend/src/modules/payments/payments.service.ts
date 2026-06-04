import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { Payment } from "@prisma/client";
import { prisma } from "../../plugins/prisma.js";
import { env } from "../../config/env.js";

type CreatePixInput = {
  name: string;
  nickname?: string;
  email: string;
  document?: string;
  passwordHash: string;
};

type AsaasCustomerResponse = {
  id: string;
};

type AsaasPaymentResponse = {
  id: string;
  status: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
};

type AsaasPixQrCodeResponse = {
  encodedImage?: string;
  payload?: string;
  expirationDate?: string;
};

type MercadoPagoPaymentResponse = {
  id: number | string;
  status: string;
  status_detail?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
};

export function paymentProvider() {
  if (env.PAYMENT_PROVIDER === "asaas") return "ASAAS";
  if (env.PAYMENT_PROVIDER === "mercado_pago") return "MERCADO_PAGO";
  return "MOCK";
}

function asaasApiKey() {
  return env.ASAAS_API_KEY?.replace(/^\$\$/, "$");
}

export function verifyMercadoPagoWebhookSignature(input: {
  dataId?: string;
  xRequestId?: string;
  xSignature?: string;
}) {
  if (!env.MERCADO_PAGO_WEBHOOK_SECRET) return true;
  if (!input.xSignature) return false;

  const signatureParts = input.xSignature.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=");
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

  const timestamp = signatureParts.ts;
  const receivedSignature = signatureParts.v1;

  if (!timestamp || !receivedSignature) return false;

  const manifest = [
    input.dataId ? `id:${input.dataId};` : "",
    input.xRequestId ? `request-id:${input.xRequestId};` : "",
    `ts:${timestamp};`
  ].join("");

  const expectedSignature = crypto
    .createHmac("sha256", env.MERCADO_PAGO_WEBHOOK_SECRET)
    .update(manifest)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(receivedSignature, "hex");

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export function paymentResponse(payment: Payment) {
  return {
    id: payment.id,
    status: payment.status,
    amountCents: payment.amountCents,
    currency: payment.currency,
    accessCode: payment.accessCode,
    qrCode: payment.qrCode,
    qrCodeBase64: payment.qrCodeBase64,
    ticketUrl: payment.ticketUrl,
    expiresAt: payment.expiresAt,
    paidAt: payment.paidAt
  };
}

export async function createPixPayment(input: CreatePixInput) {
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  const accessCode = `PIX-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const provider = paymentProvider();

  const payment = await prisma.payment.create({
    data: {
      provider,
      status: "PENDING",
      amountCents: env.REGISTRATION_PRICE_CENTS,
      name: input.name,
      nickname: input.nickname || null,
      email: input.email,
      document: input.document,
      passwordHash: input.passwordHash,
      accessCode,
      expiresAt
    }
  });

  if (provider === "MERCADO_PAGO") {
    return createMercadoPagoPix(payment);
  }

  if (provider === "ASAAS") {
    return createAsaasPix(payment);
  }

  return prisma.payment.update({
    where: { id: payment.id },
    data: {
      qrCode: `PIX MOCK - pagamento ${payment.id} - R$ ${(payment.amountCents / 100).toFixed(2)}`,
      ticketUrl: `${env.WEB_ORIGIN}/pagamento/${payment.id}`
    }
  });
}

async function createAsaasPix(payment: Payment) {
  if (!asaasApiKey()) {
    throw new Error("ASAAS_API_KEY nao configurado.");
  }

  if (!payment.document) {
    throw new Error("CPF/CNPJ e obrigatorio para gerar Pix pelo Asaas.");
  }

  const customer = await createAsaasCustomer(payment);
  const dueDate = new Date().toISOString().slice(0, 10);
  const providerPayment = await asaasRequest<AsaasPaymentResponse>("/payments", {
    method: "POST",
    body: {
      customer: customer.id,
      billingType: "PIX",
      value: payment.amountCents / 100,
      dueDate,
      description: "Inscricao Copolao",
      externalReference: payment.id
    }
  });
  const pixQrCode = await asaasRequest<AsaasPixQrCodeResponse>(`/payments/${providerPayment.id}/pixQrCode`);

  return prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerCustomerId: customer.id,
      providerPaymentId: providerPayment.id,
      providerStatus: providerPayment.status,
      qrCode: pixQrCode.payload,
      qrCodeBase64: pixQrCode.encodedImage,
      ticketUrl: providerPayment.invoiceUrl ?? providerPayment.bankSlipUrl,
      rawProviderResponse: {
        payment: providerPayment,
        pixQrCode
      }
    }
  });
}

async function createAsaasCustomer(payment: Payment) {
  return asaasRequest<AsaasCustomerResponse>("/customers", {
    method: "POST",
    body: {
      name: payment.name,
      cpfCnpj: payment.document,
      email: payment.email,
      externalReference: payment.id,
      notificationDisabled: true
    }
  });
}

async function asaasRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
  } = {}
) {
  const apiKey = asaasApiKey();
  if (!apiKey) {
    throw new Error("ASAAS_API_KEY nao configurado.");
  }

  const response = await fetch(`${env.ASAAS_API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "copolao",
      access_token: apiKey
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = (await response.json()) as T & { errors?: Array<{ description?: string }> };

  if (!response.ok) {
    const message = data.errors?.map((error) => error.description).filter(Boolean).join(" ");
    throw new Error(message || "Nao foi possivel comunicar com o Asaas.");
  }

  return data;
}

async function createMercadoPagoPix(payment: Payment) {
  if (!env.MERCADO_PAGO_ACCESS_TOKEN) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN nao configurado.");
  }

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": payment.id
    },
    body: JSON.stringify({
      transaction_amount: payment.amountCents / 100,
      description: "Inscricao Copolao",
      payment_method_id: "pix",
      external_reference: payment.id,
      notification_url: env.PUBLIC_API_URL ? `${env.PUBLIC_API_URL}/api/webhooks/mercado-pago` : undefined,
      payer: {
        email: payment.email,
        first_name: payment.name
      }
    })
  });

  const data = (await response.json()) as MercadoPagoPaymentResponse;

  if (!response.ok) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        rawProviderResponse: data
      }
    });
    throw new Error("Nao foi possivel criar o Pix no Mercado Pago.");
  }

  const transactionData = data.point_of_interaction?.transaction_data;

  return prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerPaymentId: String(data.id),
      providerStatus: data.status,
      providerStatusDetail: data.status_detail,
      qrCode: transactionData?.qr_code,
      qrCodeBase64: transactionData?.qr_code_base64,
      ticketUrl: transactionData?.ticket_url,
      rawProviderResponse: data
    }
  });
}

export async function syncPaymentWithProvider(payment: Payment, app?: FastifyInstance) {
  if (payment.status !== "PENDING") return payment;

  if (payment.expiresAt <= new Date()) {
    return prisma.payment.update({
      where: { id: payment.id },
      data: { status: "EXPIRED" }
    });
  }

  if (payment.provider === "MERCADO_PAGO" && payment.providerPaymentId) {
    const providerPayment = await fetchMercadoPagoPayment(payment.providerPaymentId);
    return applyProviderPaymentStatus(payment, providerPayment, app);
  }

  if (payment.provider === "ASAAS" && payment.providerPaymentId) {
    const providerPayment = await fetchAsaasPayment(payment.providerPaymentId);
    return applyAsaasPaymentStatus(payment, providerPayment);
  }

  return payment;
}

export async function fetchAsaasPayment(providerPaymentId: string) {
  return asaasRequest<AsaasPaymentResponse>(`/payments/${providerPaymentId}`);
}

export async function applyAsaasPaymentStatus(payment: Payment, providerPayment: AsaasPaymentResponse) {
  const status = ["RECEIVED", "CONFIRMED"].includes(providerPayment.status) ? "PAID" : payment.status;
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status,
      providerStatus: providerPayment.status,
      rawProviderResponse: providerPayment,
      paidAt: status === "PAID" ? payment.paidAt ?? new Date() : payment.paidAt
    }
  });

  if (updatedPayment.status === "PAID") {
    await activatePaidSignup(updatedPayment);
  }

  return updatedPayment;
}

export async function fetchMercadoPagoPayment(providerPaymentId: string) {
  if (!env.MERCADO_PAGO_ACCESS_TOKEN) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN nao configurado.");
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${providerPaymentId}`, {
    headers: {
      Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`
    }
  });

  const data = (await response.json()) as MercadoPagoPaymentResponse;
  if (!response.ok) {
    throw new Error("Nao foi possivel consultar o pagamento no Mercado Pago.");
  }

  return data;
}

export async function applyProviderPaymentStatus(payment: Payment, providerPayment: MercadoPagoPaymentResponse, app?: FastifyInstance) {
  const status = providerPayment.status === "approved" ? "PAID" : payment.status;
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status,
      providerStatus: providerPayment.status,
      providerStatusDetail: providerPayment.status_detail,
      rawProviderResponse: providerPayment,
      paidAt: status === "PAID" ? payment.paidAt ?? new Date() : payment.paidAt
    }
  });

  if (updatedPayment.status === "PAID") {
    await activatePaidSignup(updatedPayment);
  }

  return updatedPayment;
}

export async function activatePaidSignup(payment: Payment) {
  return prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({ where: { email: payment.email } });
    if (existingUser) return existingUser;

    await tx.inviteCode.upsert({
      where: { code: payment.accessCode },
      update: {
        isActive: true,
        maxUses: 1,
        usedCount: 1
      },
      create: {
        code: payment.accessCode,
        label: `Pagamento PIX ${payment.email}`,
        isActive: true,
        maxUses: 1,
        usedCount: 1
      }
    });

    return tx.user.create({
      data: {
        name: payment.name,
        nickname: payment.nickname,
        email: payment.email,
        passwordHash: payment.passwordHash,
        role: "PARTICIPANT",
        acceptedInviteCode: payment.accessCode
      }
    });
  });
}

export async function paymentAuthPayload(payment: Payment, app: FastifyInstance) {
  if (payment.status !== "PAID") return null;

  const user = await activatePaidSignup(payment);
  const token = app.jwt.sign({ sub: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      email: user.email,
      role: user.role
    }
  };
}
