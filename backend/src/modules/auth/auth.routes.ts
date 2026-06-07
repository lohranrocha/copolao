import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../plugins/prisma.js";

const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1)
});

const registerSchema = z.object({
  name: z.string().trim().min(2).max(150),
  nickname: z.string().trim().max(80).optional(),
  email: z.string().trim().email().max(150).transform((value) => value.toLowerCase()),
  password: z.string().min(6).max(100),
  inviteCode: z.string().trim().min(3).max(60).transform((value) => value.toUpperCase())
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      return reply.status(409).send({ message: "Este e-mail ja esta cadastrado." });
    }

    const invite = await prisma.inviteCode.findUnique({ where: { code: body.inviteCode } });
    if (!invite || !invite.isActive) {
      return reply.status(400).send({ message: "Codigo de convite invalido." });
    }

    if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) {
      return reply.status(400).send({ message: "Codigo de convite esgotado." });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const inviteUpdate = await tx.inviteCode.updateMany({
        where: {
          id: invite.id,
          isActive: true,
          ...(invite.maxUses === null ? {} : { usedCount: { lt: invite.maxUses } })
        },
        data: { usedCount: { increment: 1 } }
      });

      if (inviteUpdate.count === 0) {
        throw new Error("INVITE_UNAVAILABLE");
      }

      return tx.user.create({
        data: {
          name: body.name,
          nickname: body.nickname,
          email: body.email,
          passwordHash,
          role: "PARTICIPANT",
          acceptedInviteCode: invite.code
        }
      });
    }).catch((error) => {
      if (error instanceof Error && error.message === "INVITE_UNAVAILABLE") {
        return null;
      }
      throw error;
    });

    if (!user) {
      return reply.status(400).send({ message: "Codigo de convite esgotado." });
    }

    const token = app.jwt.sign({ sub: user.id, role: user.role });

    return reply.status(201).send({
      token,
      user: {
        id: user.id,
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        role: user.role
      }
    });
  });

  app.post("/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });

    if (!user) {
      return reply.status(401).send({ message: "E-mail ou senha invalidos." });
    }

    const passwordMatches = await bcrypt.compare(body.password, user.passwordHash);
    if (!passwordMatches) {
      return reply.status(401).send({ message: "E-mail ou senha invalidos." });
    }

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
  });
}
