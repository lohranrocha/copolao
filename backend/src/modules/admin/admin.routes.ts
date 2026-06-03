import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../plugins/prisma.js";
import { requireAdmin } from "../../utils/http.js";
import { getBonusQuestionState, isBonusAnswerCorrect } from "../../utils/bonus.js";

const uuidParamsSchema = z.object({
  id: z.string().uuid()
});

const createInviteSchema = z.object({
  code: z.string().trim().min(3).max(60).transform((value) => value.toUpperCase()),
  label: z.string().trim().min(2).max(120),
  maxUses: z.number().int().min(1).nullable().optional()
});

const updateInviteSchema = z.object({
  label: z.string().trim().min(2).max(120).optional(),
  isActive: z.boolean().optional(),
  maxUses: z.number().int().min(1).nullable().optional()
});

const createBonusQuestionSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(255),
  points: z.number().int().min(1).max(100),
  lockAtUtc: z.string().datetime()
});

const bonusResultSchema = z.object({
  correctAnswer: z.string().trim().min(1).max(120)
});

export async function adminRoutes(app: FastifyInstance) {
  app.get("/invite-codes", { preHandler: requireAdmin }, async () => {
    const inviteCodes = await prisma.inviteCode.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }]
    });

    return { inviteCodes };
  });

  app.post("/invite-codes", { preHandler: requireAdmin }, async (request, reply) => {
    const body = createInviteSchema.parse(request.body);
    const existingInvite = await prisma.inviteCode.findUnique({ where: { code: body.code } });
    if (existingInvite) {
      return reply.status(409).send({ message: "Este codigo de convite ja existe." });
    }

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code: body.code,
        label: body.label,
        maxUses: body.maxUses ?? null,
        isActive: true
      }
    });

    return reply.status(201).send({ inviteCode });
  });

  app.patch("/invite-codes/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = uuidParamsSchema.parse(request.params);
    const body = updateInviteSchema.parse(request.body);

    const inviteCode = await prisma.inviteCode.update({
      where: { id },
      data: body
    }).catch(() => null);

    if (!inviteCode) {
      return reply.status(404).send({ message: "Codigo de convite nao encontrado." });
    }

    return { inviteCode };
  });

  app.get("/bonus-questions", { preHandler: requireAdmin }, async () => {
    const questions = await prisma.bonusQuestion.findMany({
      orderBy: [{ lockAtUtc: "asc" }, { title: "asc" }],
      include: {
        predictions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                nickname: true
              }
            }
          }
        }
      }
    });

    return {
      questions: questions.map((question) => ({
        ...question,
        computedState: getBonusQuestionState(question)
      }))
    };
  });

  app.post("/bonus-questions", { preHandler: requireAdmin }, async (request, reply) => {
    const body = createBonusQuestionSchema.parse(request.body);
    const existingQuestion = await prisma.bonusQuestion.findUnique({ where: { title: body.title } });
    if (existingQuestion) {
      return reply.status(409).send({ message: "Ja existe uma pergunta bonus com esse titulo." });
    }

    const question = await prisma.bonusQuestion.create({
      data: {
        title: body.title,
        description: body.description,
        points: body.points,
        lockAtUtc: new Date(body.lockAtUtc),
        isActive: true
      }
    });

    return reply.status(201).send({
      question: {
        ...question,
        computedState: getBonusQuestionState(question)
      }
    });
  });

  app.patch("/bonus-questions/:id/result", { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = uuidParamsSchema.parse(request.params);
    const body = bonusResultSchema.parse(request.body);

    const question = await prisma.bonusQuestion.findUnique({
      where: { id },
      include: { predictions: true }
    });

    if (!question) {
      return reply.status(404).send({ message: "Pergunta bonus nao encontrada." });
    }

    const updatedQuestion = await prisma.$transaction(async (tx) => {
      const savedQuestion = await tx.bonusQuestion.update({
        where: { id },
        data: { correctAnswer: body.correctAnswer }
      });

      for (const prediction of question.predictions) {
        const isCorrect = isBonusAnswerCorrect(prediction.answer, body.correctAnswer);
        await tx.bonusPrediction.update({
          where: { id: prediction.id },
          data: {
            isCorrect,
            points: isCorrect ? question.points : 0
          }
        });
      }

      return savedQuestion;
    });

    return {
      question: {
        ...updatedQuestion,
        computedState: getBonusQuestionState(updatedQuestion)
      }
    };
  });
}
