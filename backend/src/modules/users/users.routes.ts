import type { FastifyInstance } from "fastify";
import { requireAdmin, requireAuth } from "../../utils/http.js";
import { prisma } from "../../plugins/prisma.js";

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
}
