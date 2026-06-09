import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { bonusRoutes } from "./modules/bonus/bonus.routes.js";
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
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET
  });

  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: 3 * 1024 * 1024
    }
  });

  app.get("/api/health", async () => ({ ok: true }));
  app.get<{ Params: { filename: string } }>("/uploads/avatars/:filename", async (request, reply) => {
    const { filename } = request.params;

    if (!/^[a-zA-Z0-9-]+\.webp$/.test(filename)) {
      return reply.status(404).send({ message: "Arquivo nao encontrado." });
    }

    const filePath = path.join(env.UPLOAD_DIR, "avatars", filename);
    try {
      await access(filePath);
    } catch {
      return reply.status(404).send({ message: "Arquivo nao encontrado." });
    }

    return reply
      .type("image/webp")
      .header("Cache-Control", "public, max-age=31536000, immutable")
      .send(createReadStream(filePath));
  });

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(adminRoutes, { prefix: "/api/admin" });
  await app.register(bonusRoutes, { prefix: "/api/bonus" });
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
