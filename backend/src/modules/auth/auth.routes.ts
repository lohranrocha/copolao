import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../plugins/prisma.js";

const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1)
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (request, reply) => {
    return reply.status(410).send({ message: "Cadastro por convite foi desativado. Gere o Pix para participar." });
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
