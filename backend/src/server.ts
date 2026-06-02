import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { matchesRoutes } from "./modules/matches/matches.routes.js";
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
    credentials: true
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET
  });

  app.get("/api/health", async () => ({ ok: true }));
  await app.register(authRoutes, { prefix: "/api/auth" });
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
