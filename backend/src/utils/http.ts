import type { FastifyReply, FastifyRequest } from "fastify";

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ message: "Autenticacao obrigatoria." });
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
