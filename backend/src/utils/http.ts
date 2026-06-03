import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../plugins/prisma.js";

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ message: "Autenticacao obrigatoria." });
  }

  const userExists = await prisma.user.findUnique({
    where: { id: request.user.sub },
    select: { id: true }
  });

  if (!userExists) {
    return reply.status(401).send({ message: "Sessao expirada. Faca login novamente." });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);

  if (reply.sent) {
    return;
  }

  if (request.user.role !== "ADMIN") {
    return reply.status(403).send({ message: "Acesso restrito ao administrador." });
  }
}
