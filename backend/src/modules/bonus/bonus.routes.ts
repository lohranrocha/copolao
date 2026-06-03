import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../plugins/prisma.js";
import { requireAuth } from "../../utils/http.js";
import { canPredictBonus, getBonusQuestionState } from "../../utils/bonus.js";

const paramsSchema = z.object({
  questionId: z.string().uuid()
});

const predictionSchema = z.object({
  answer: z.string().trim().min(1).max(120)
});

export async function bonusRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireAuth }, async (request) => {
    const questions = await prisma.bonusQuestion.findMany({
      where: { isActive: true },
      orderBy: [{ lockAtUtc: "asc" }, { title: "asc" }],
      include: {
        predictions: {
          where: { userId: request.user.sub },
          select: {
            id: true,
            answer: true,
            points: true,
            isCorrect: true,
            updatedAt: true
          }
        }
      }
    });

    return {
      questions: questions.map((question) => ({
        id: question.id,
        title: question.title,
        description: question.description,
        points: question.points,
        lockAtUtc: question.lockAtUtc,
        correctAnswer: question.correctAnswer,
        computedState: getBonusQuestionState(question),
        myPrediction: question.predictions[0] ?? null
      }))
    };
  });

  app.put("/:questionId/prediction", { preHandler: requireAuth }, async (request, reply) => {
    const { questionId } = paramsSchema.parse(request.params);
    const body = predictionSchema.parse(request.body);

    const question = await prisma.bonusQuestion.findUnique({ where: { id: questionId } });
    if (!question || !question.isActive) {
      return reply.status(404).send({ message: "Pergunta bonus nao encontrada." });
    }

    if (!canPredictBonus(question)) {
      return reply.status(400).send({ message: "Esse palpite bonus ja foi fechado." });
    }

    const prediction = await prisma.bonusPrediction.upsert({
      where: {
        userId_questionId: {
          userId: request.user.sub,
          questionId
        }
      },
      create: {
        userId: request.user.sub,
        questionId,
        answer: body.answer
      },
      update: {
        answer: body.answer,
        points: 0,
        isCorrect: false
      }
    });

    return { prediction };
  });
}
