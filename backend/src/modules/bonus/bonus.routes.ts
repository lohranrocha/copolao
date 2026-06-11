import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../plugins/prisma.js";
import { requireAuth } from "../../utils/http.js";
import { canPredictBonus, getBonusQuestionState } from "../../utils/bonus.js";
import {
  getGroupLockAt,
  getGroupStandingState,
  getGroupTeams,
  groupStandingBonusControlKey,
  validateStandingTeams
} from "../../utils/groupStandings.js";

const paramsSchema = z.object({
  questionId: z.string().uuid()
});

const groupParamsSchema = z.object({
  groupCode: z.string().trim().min(1).max(2).transform((value) => value.toUpperCase())
});

const predictionSchema = z.object({
  answer: z.string().trim().min(1).max(120)
});

const groupPredictionSchema = z.object({
  firstTeam: z.string().trim().min(1).max(100),
  secondTeam: z.string().trim().min(1).max(100),
  thirdTeam: z.string().trim().min(1).max(100),
  fourthTeam: z.string().trim().min(1).max(100)
});

const groupPredictionsSchema = z.object({
  groups: z.array(
    groupPredictionSchema.extend({
      groupCode: z.string().trim().min(1).max(2).transform((value) => value.toUpperCase())
    })
  )
});

export async function bonusRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireAuth }, async (request) => {
    const [questions, groupMatches, groupPredictions, groupResults, groupControl] = await Promise.all([
      prisma.bonusQuestion.findMany({
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
      }),
      prisma.match.findMany({
        where: {
          stage: "GROUP_STAGE",
          groupCode: { not: null }
        },
        orderBy: [{ groupCode: "asc" }, { matchDateUtc: "asc" }]
      }),
      prisma.groupStandingPrediction.findMany({
        where: { userId: request.user.sub }
      }),
      prisma.groupStandingResult.findMany(),
      prisma.bonusControl.findUnique({ where: { key: groupStandingBonusControlKey } })
    ]);

    const predictionByGroup = new Map(groupPredictions.map((prediction) => [prediction.groupCode, prediction]));
    const resultByGroup = new Map(groupResults.map((result) => [result.groupCode, result]));
    const matchesByGroup = new Map<string, typeof groupMatches>();

    for (const match of groupMatches) {
      if (!match.groupCode) continue;
      matchesByGroup.set(match.groupCode, [...(matchesByGroup.get(match.groupCode) ?? []), match]);
    }

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
      })),
      groupStandings: Array.from(matchesByGroup.entries()).map(([groupCode, matches]) => {
        const lockAtUtc = getGroupLockAt(matches, groupControl?.lockAtUtc) ?? new Date();
        const result = resultByGroup.get(groupCode);

        return {
          groupCode,
          teams: getGroupTeams(matches),
          lockAtUtc,
          computedState: getGroupStandingState(lockAtUtc, Boolean(result)),
          result,
          myPrediction: predictionByGroup.get(groupCode) ?? null
        };
      })
    };
  });

  app.put("/groups/predictions", { preHandler: requireAuth }, async (request, reply) => {
    const body = groupPredictionsSchema.parse(request.body);

    const matches = await prisma.match.findMany({
      where: {
        stage: "GROUP_STAGE",
        groupCode: { not: null }
      },
      orderBy: [{ groupCode: "asc" }, { matchDateUtc: "asc" }]
    });

    const matchesByGroup = new Map<string, typeof matches>();
    for (const match of matches) {
      if (!match.groupCode) continue;
      matchesByGroup.set(match.groupCode, [...(matchesByGroup.get(match.groupCode) ?? []), match]);
    }

    const expectedGroupCodes = Array.from(matchesByGroup.keys());
    const submittedGroupCodes = body.groups.map((group) => group.groupCode);

    if (new Set(submittedGroupCodes).size !== submittedGroupCodes.length) {
      return reply.status(400).send({ message: "Ha grupos repetidos no envio." });
    }

    if (submittedGroupCodes.length !== expectedGroupCodes.length || expectedGroupCodes.some((groupCode) => !submittedGroupCodes.includes(groupCode))) {
      return reply.status(400).send({ message: "Preencha a classificacao de todos os grupos antes de salvar." });
    }

    const [results, groupControl] = await Promise.all([
      prisma.groupStandingResult.findMany({
        where: { groupCode: { in: expectedGroupCodes } }
      }),
      prisma.bonusControl.findUnique({ where: { key: groupStandingBonusControlKey } })
    ]);
    const resultByGroup = new Map(results.map((result) => [result.groupCode, result]));

    for (const group of body.groups) {
      const groupMatches = matchesByGroup.get(group.groupCode);
      if (!groupMatches) {
        return reply.status(404).send({ message: `Grupo ${group.groupCode} nao encontrado.` });
      }

      if (!validateStandingTeams(group, getGroupTeams(groupMatches))) {
        return reply.status(400).send({ message: `Escolha os quatro times do Grupo ${group.groupCode} sem repetir.` });
      }

      const lockAtUtc = getGroupLockAt(groupMatches, groupControl?.lockAtUtc) ?? new Date();
      if (getGroupStandingState(lockAtUtc, Boolean(resultByGroup.get(group.groupCode))) !== "OPEN") {
        return reply.status(400).send({ message: `Os palpites de classificacao do Grupo ${group.groupCode} ja foram fechados.` });
      }
    }

    const predictions = await prisma.$transaction((tx) =>
      Promise.all(
        body.groups.map(({ groupCode, ...prediction }) =>
          tx.groupStandingPrediction.upsert({
            where: {
              userId_groupCode: {
                userId: request.user.sub,
                groupCode
              }
            },
            create: {
              userId: request.user.sub,
              groupCode,
              ...prediction
            },
            update: {
              ...prediction,
              points: 0,
              correctPositions: 0,
              isPerfect: false
            }
          })
        )
      )
    );

    return { predictions };
  });

  app.put("/groups/:groupCode/prediction", { preHandler: requireAuth }, async (request, reply) => {
    const { groupCode } = groupParamsSchema.parse(request.params);
    const body = groupPredictionSchema.parse(request.body);

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
      return reply.status(400).send({ message: "Escolha os quatro times do grupo sem repetir." });
    }

    const [result, groupControl] = await Promise.all([
      prisma.groupStandingResult.findUnique({ where: { groupCode } }),
      prisma.bonusControl.findUnique({ where: { key: groupStandingBonusControlKey } })
    ]);
    const lockAtUtc = getGroupLockAt(matches, groupControl?.lockAtUtc) ?? new Date();

    if (getGroupStandingState(lockAtUtc, Boolean(result)) !== "OPEN") {
      return reply.status(400).send({ message: "Os palpites de classificacao deste grupo ja foram fechados." });
    }

    const prediction = await prisma.groupStandingPrediction.upsert({
      where: {
        userId_groupCode: {
          userId: request.user.sub,
          groupCode
        }
      },
      create: {
        userId: request.user.sub,
        groupCode,
        ...body
      },
      update: {
        ...body,
        points: 0,
        correctPositions: 0,
        isPerfect: false
      }
    });

    return { prediction };
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
