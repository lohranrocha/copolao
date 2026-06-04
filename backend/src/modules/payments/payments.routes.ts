import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../plugins/prisma.js";
import {
  activatePaidSignup,
  applyAsaasPaymentStatus,
  applyProviderPaymentStatus,
  createPixPayment,
  fetchAsaasPayment,
  fetchMercadoPagoPayment,
  paymentAuthPayload,
  paymentResponse,
  syncPaymentWithProvider,
  verifyMercadoPagoWebhookSignature
} from "./payments.service.js";

const createPixPaymentSchema = z.object({
  name: z.string().trim().min(2).max(150),
  nickname: z.string().trim().max(80).optional(),
  email: z.string().trim().email().max(150).transform((value) => value.toLowerCase()),
  document: z.string().trim().min(11).max(20).optional().transform((value) => value?.replace(/\D/g, "")),
  password: z.string().min(6).max(100)
});

const paymentParamsSchema = z.object({
  paymentId: z.string().uuid()
});

const mercadoPagoWebhookSchema = z.object({
  data: z.object({ id: z.union([z.string(), z.number()]).optional() }).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  topic: z.string().optional(),
  type: z.string().optional(),
  action: z.string().optional()
}).passthrough();

const mercadoPagoWebhookQuerySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  "data.id": z.union([z.string(), z.number()]).optional(),
  topic: z.string().optional(),
  type: z.string().optional()
}).passthrough();

const asaasWebhookSchema = z.object({
  event: z.string().optional(),
  payment: z.object({
    id: z.string(),
    status: z.string().optional()
  }).passthrough()
}).passthrough();

export async function paymentsRoutes(app: FastifyInstance) {
  app.post("/payments/pix", async (request, reply) => {
    const body = createPixPaymentSchema.parse(request.body);

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      return reply.status(409).send({ message: "Este e-mail ja esta cadastrado." });
    }

    const activePayment = await prisma.payment.findFirst({
      where: {
        email: body.email,
        status: "PENDING",
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    });

    if (activePayment) {
      return {
        payment: paymentResponse(activePayment)
      };
    }

    const payment = await createPixPayment({
      name: body.name,
      nickname: body.nickname,
      email: body.email,
      document: body.document,
      passwordHash: await bcrypt.hash(body.password, 10)
    });

    return reply.status(201).send({
      payment: paymentResponse(payment)
    });
  });

  app.get("/payments/:paymentId/status", async (request, reply) => {
    const { paymentId } = paymentParamsSchema.parse(request.params);
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

    if (!payment) {
      return reply.status(404).send({ message: "Pagamento nao encontrado." });
    }

    const syncedPayment = await syncPaymentWithProvider(payment);
    return {
      payment: paymentResponse(syncedPayment),
      auth: await paymentAuthPayload(syncedPayment, app)
    };
  });

  app.post("/payments/:paymentId/mock-paid", async (request, reply) => {
    const { paymentId } = paymentParamsSchema.parse(request.params);
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

    if (!payment) {
      return reply.status(404).send({ message: "Pagamento nao encontrado." });
    }

    if (payment.provider !== "MOCK") {
      return reply.status(400).send({ message: "Simulacao permitida apenas no modo mock." });
    }

    const paidPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        providerStatus: "approved",
        providerStatusDetail: "mock_approved",
        paidAt: new Date()
      }
    });

    await activatePaidSignup(paidPayment);

    return {
      payment: paymentResponse(paidPayment),
      auth: await paymentAuthPayload(paidPayment, app)
    };
  });

  app.post("/webhooks/mercado-pago", async (request, reply) => {
    const body = mercadoPagoWebhookSchema.parse(request.body ?? {});
    const query = mercadoPagoWebhookQuerySchema.parse(request.query ?? {});
    const providerPaymentId = String(body.data?.id ?? body.id ?? query["data.id"] ?? query.id ?? "");
    const signedDataId = query["data.id"] ? String(query["data.id"]) : undefined;
    const xSignature = Array.isArray(request.headers["x-signature"])
      ? request.headers["x-signature"][0]
      : request.headers["x-signature"];
    const xRequestId = Array.isArray(request.headers["x-request-id"])
      ? request.headers["x-request-id"][0]
      : request.headers["x-request-id"];

    const validSignature = verifyMercadoPagoWebhookSignature({
      dataId: signedDataId,
      xRequestId,
      xSignature
    });

    if (!validSignature) {
      return reply.status(401).send({ message: "Assinatura do webhook invalida." });
    }

    if (!providerPaymentId) {
      return reply.status(202).send({ received: true });
    }

    const payment = await prisma.payment.findUnique({
      where: { providerPaymentId }
    });

    if (!payment) {
      return reply.status(202).send({ received: true });
    }

    const providerPayment = await fetchMercadoPagoPayment(providerPaymentId);
    await applyProviderPaymentStatus(payment, providerPayment);

    return { received: true };
  });

  app.post("/webhooks/asaas", async (request, reply) => {
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
    const receivedToken = Array.isArray(request.headers["asaas-access-token"])
      ? request.headers["asaas-access-token"][0]
      : request.headers["asaas-access-token"];

    if (expectedToken && receivedToken !== expectedToken) {
      return reply.status(401).send({ message: "Token do webhook invalido." });
    }

    const body = asaasWebhookSchema.parse(request.body ?? {});
    const providerPaymentId = body.payment.id;

    const payment = await prisma.payment.findUnique({
      where: { providerPaymentId }
    });

    if (!payment) {
      return reply.status(202).send({ received: true });
    }

    if (body.event === "PAYMENT_RECEIVED" || body.payment.status === "RECEIVED" || body.payment.status === "CONFIRMED") {
      const providerPayment = await fetchAsaasPayment(providerPaymentId);
      await applyAsaasPaymentStatus(payment, providerPayment);
    }

    return { received: true };
  });
}
