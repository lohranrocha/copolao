import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../plugins/prisma.js";
import { requireAdmin } from "../../utils/http.js";
import { getBonusQuestionState, isBonusAnswerCorrect } from "../../utils/bonus.js";
import {
  calculateGroupStandingScore,
  getGroupLockAt,
  getGroupStandingState,
  getGroupTeams,
  validateStandingTeams
} from "../../utils/groupStandings.js";

const uuidParamsSchema = z.object({
  id: z.string().uuid()
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

const groupParamsSchema = z.object({
  groupCode: z.string().trim().min(1).max(2).transform((value) => value.toUpperCase())
});

const groupStandingResultSchema = z.object({
  firstTeam: z.string().trim().min(1).max(100),
  secondTeam: z.string().trim().min(1).max(100),
  thirdTeam: z.string().trim().min(1).max(100),
  fourthTeam: z.string().trim().min(1).max(100)
});

export async function adminRoutes(app: FastifyInstance) {
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

  app.get("/group-standings", { preHandler: requireAdmin }, async () => {
    const [groupMatches, predictions, results] = await Promise.all([
      prisma.match.findMany({
        where: {
          stage: "GROUP_STAGE",
          groupCode: { not: null }
        },
        orderBy: [{ groupCode: "asc" }, { matchDateUtc: "asc" }]
      }),
      prisma.groupStandingPrediction.findMany(),
      prisma.groupStandingResult.findMany()
    ]);

    const matchesByGroup = new Map<string, typeof groupMatches>();
    for (const match of groupMatches) {
      if (!match.groupCode) continue;
      matchesByGroup.set(match.groupCode, [...(matchesByGroup.get(match.groupCode) ?? []), match]);
    }

    const predictionCountByGroup = predictions.reduce<Record<string, number>>((acc, prediction) => {
      acc[prediction.groupCode] = (acc[prediction.groupCode] ?? 0) + 1;
      return acc;
    }, {});
    const resultByGroup = new Map(results.map((result) => [result.groupCode, result]));

    return {
      groups: Array.from(matchesByGroup.entries()).map(([groupCode, matches]) => {
        const lockAtUtc = getGroupLockAt(matches) ?? new Date();
        const result = resultByGroup.get(groupCode);

        return {
          groupCode,
          teams: getGroupTeams(matches),
          lockAtUtc,
          computedState: getGroupStandingState(lockAtUtc, Boolean(result)),
          result: result ?? null,
          predictionCount: predictionCountByGroup[groupCode] ?? 0
        };
      })
    };
  });

  app.patch("/group-standings/:groupCode/result", { preHandler: requireAdmin }, async (request, reply) => {
    const { groupCode } = groupParamsSchema.parse(request.params);
    const body = groupStandingResultSchema.parse(request.body);

    const matches = await prisma.match.findMany({
      where: {
        stage: "GROUP_STAGE",
        groupCode
      }
    });

    if (matches.length === 0) {
      return reply.status(404).send({ message: "Grupo nao encontrado." });
    }

    const teams = getGroupTeams(matches);
    if (!validateStandingTeams(body, teams)) {
      return reply.status(400).send({ message: "Informe os quatro times do grupo sem repetir." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const savedResult = await tx.groupStandingResult.upsert({
        where: { groupCode },
        create: {
          groupCode,
          ...body
        },
        update: body
      });

      const predictions = await tx.groupStandingPrediction.findMany({ where: { groupCode } });

      for (const prediction of predictions) {
        await tx.groupStandingPrediction.update({
          where: { id: prediction.id },
          data: calculateGroupStandingScore(prediction, body)
        });
      }

      return savedResult;
    });

    return { result };
  });
}
