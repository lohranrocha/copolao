import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(24),
  PORT: z.coerce.number().int().positive().default(3333),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  PAYMENT_PROVIDER: z.enum(["mock", "mercado_pago", "asaas"]).default("mock"),
  REGISTRATION_PRICE_CENTS: z.coerce.number().int().positive().default(2000),
  ASAAS_API_URL: z.string().url().default("https://api-sandbox.asaas.com/v3"),
  ASAAS_API_KEY: z.string().optional(),
  ASAAS_WEBHOOK_TOKEN: z.string().optional(),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADO_PAGO_PUBLIC_KEY: z.string().optional(),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().optional(),
  PUBLIC_API_URL: z.string().url().optional()
});

export const env = envSchema.parse(process.env);
