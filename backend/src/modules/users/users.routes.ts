import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAdmin, requireAuth } from "../../utils/http.js";
import { prisma } from "../../plugins/prisma.js";

const updateMeSchema = z.object({
  name: z.string().trim().min(2).max(150),
  nickname: z.string().trim().max(80).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).max(100).optional()
});

const userParamsSchema = z.object({
  userId: z.string().uuid()
});

export async function usersRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: requireAuth }, async (request) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.user.sub },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        role: true,
        acceptedInviteCode: true,
        createdAt: true
      }
    });

    return { user };
  });

  app.patch("/me", { preHandler: requireAuth }, async (request, reply) => {
    const body = updateMeSchema.parse(request.body);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.user.sub }
    });

    if (body.newPassword) {
      if (!body.currentPassword) {
        return reply.status(400).send({ message: "Informe sua senha atual para alterar a senha." });
      }

      const passwordMatches = await bcrypt.compare(body.currentPassword, user.passwordHash);
      if (!passwordMatches) {
        return reply.status(400).send({ message: "Senha atual incorreta." });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: request.user.sub },
      data: {
        name: body.name,
        nickname: body.nickname || null,
        ...(body.newPassword ? { passwordHash: await bcrypt.hash(body.newPassword, 10) } : {})
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        role: true,
        acceptedInviteCode: true,
        createdAt: true
      }
    });

    return { user: updatedUser };
  });

  app.get("/", { preHandler: requireAdmin }, async () => {
    const users = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        role: true,
        acceptedInviteCode: true,
        createdAt: true
      }
    });

    return { users };
  });

  app.delete("/:userId", { preHandler: requireAdmin }, async (request, reply) => {
    const { userId } = userParamsSchema.parse(request.params);

    if (userId === request.user.sub) {
      return reply.status(400).send({ message: "Voce nao pode excluir seu proprio usuario." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        acceptedInviteCode: true
      }
    });

    if (!user) {
      return reply.status(404).send({ message: "Usuario nao encontrado." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id: userId } });

      if (user.acceptedInviteCode) {
        const inviteCode = await tx.inviteCode.findUnique({
          where: { code: user.acceptedInviteCode },
          select: { id: true, usedCount: true }
        });

        if (inviteCode && inviteCode.usedCount > 0) {
          await tx.inviteCode.update({
            where: { id: inviteCode.id },
            data: { usedCount: { decrement: 1 } }
          });
        }
      }
    });

    return reply.status(204).send();
  });
}
