import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { env } from "../../config/env.js";
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

const userSelect = {
  id: true,
  name: true,
  nickname: true,
  email: true,
  avatarUrl: true,
  role: true,
  acceptedInviteCode: true,
  createdAt: true
} as const;

const allowedAvatarTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const avatarFileNamePattern = /^[a-zA-Z0-9-]+\.webp$/;

function getStoredAvatarFileName(avatarUrl: string | null) {
  if (!avatarUrl) return null;
  const filename = avatarUrl.split("/").pop();
  return filename && avatarFileNamePattern.test(filename) ? filename : null;
}

async function removeStoredAvatar(avatarUrl: string | null) {
  const filename = getStoredAvatarFileName(avatarUrl);
  if (!filename) return;

  await unlink(path.join(env.UPLOAD_DIR, "avatars", filename)).catch(() => undefined);
}

export async function usersRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: requireAuth }, async (request) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.user.sub },
      select: userSelect
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
      select: userSelect
    });

    return { user: updatedUser };
  });

  app.post("/me/avatar", { preHandler: requireAuth }, async (request, reply) => {
    const upload = await request.file();

    if (!upload) {
      return reply.status(400).send({ message: "Envie uma imagem para atualizar sua foto." });
    }

    if (!allowedAvatarTypes.has(upload.mimetype)) {
      return reply.status(400).send({ message: "Use uma imagem JPG, PNG ou WebP." });
    }

    let inputBuffer: Buffer;
    try {
      inputBuffer = await upload.toBuffer();
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "FST_REQ_FILE_TOO_LARGE") {
        return reply.status(400).send({ message: "A imagem deve ter no maximo 3 MB." });
      }
      throw error;
    }

    let avatarBuffer: Buffer;
    try {
      avatarBuffer = await sharp(inputBuffer)
        .rotate()
        .resize(320, 320, { fit: "cover" })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      return reply.status(400).send({ message: "Nao foi possivel processar esta imagem." });
    }

    const currentUser = await prisma.user.findUniqueOrThrow({
      where: { id: request.user.sub },
      select: { avatarUrl: true }
    });

    const avatarDir = path.join(env.UPLOAD_DIR, "avatars");
    await mkdir(avatarDir, { recursive: true });

    const filename = `${request.user.sub}-${Date.now()}.webp`;
    await writeFile(path.join(avatarDir, filename), avatarBuffer);

    const updatedUser = await prisma.user.update({
      where: { id: request.user.sub },
      data: { avatarUrl: `/uploads/avatars/${filename}` },
      select: userSelect
    });

    await removeStoredAvatar(currentUser.avatarUrl);

    return { user: updatedUser };
  });

  app.get("/", { preHandler: requireAdmin }, async () => {
    const users = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: userSelect
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
        acceptedInviteCode: true,
        avatarUrl: true
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

    await removeStoredAvatar(user.avatarUrl);

    return reply.status(204).send();
  });
}
