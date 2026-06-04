import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { bonusRoutes } from "./modules/bonus/bonus.routes.js";
import { matchesRoutes } from "./modules/matches/matches.routes.js";
import { paymentsRoutes } from "./modules/payments/payments.routes.js";
import { predictionsRoutes } from "./modules/predictions/predictions.routes.js";
import { rankingRoutes } from "./modules/ranking/ranking.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { prisma } from "./plugins/prisma.js";

export async function buildServer() {
  const app = Fastify({
    logger: true
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: "Dados invalidos.",
        issues: error.issues
      });
    }

    app.log.error(error);
    return reply.status(500).send({ message: "Erro interno do servidor." });
  });

  await app.register(cors, {
    origin: env.WEB_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET
  });

  app.get("/api/health", async () => ({ ok: true }));
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(adminRoutes, { prefix: "/api/admin" });
  await app.register(bonusRoutes, { prefix: "/api/bonus" });
  await app.register(paymentsRoutes, { prefix: "/api" });
  await app.register(usersRoutes, { prefix: "/api/users" });
  await app.register(matchesRoutes, { prefix: "/api/matches" });
  await app.register(predictionsRoutes, { prefix: "/api" });
  await app.register(rankingRoutes, { prefix: "/api/ranking" });

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  return app;
}

const app = await buildServer();

try {
  await app.listen({ host: "0.0.0.0", port: env.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
