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
  groupStandingBonusControlKey,
  validateStandingTeams
} from "../../utils/groupStandings.js";
import {
  getKnockoutLockAt,
  getKnockoutMatchTemplate,
  type KnockoutMatchTemplate,
  knockoutMatchTemplates
} from "../../utils/knockout.js";
import { getComputedMatchState } from "../../utils/matches.js";

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

const bonusWindowSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("OPEN"),
    lockAtUtc: z.string().datetime()
  }),
  z.object({
    mode: z.literal("CLOSE")
  })
]);

const groupParamsSchema = z.object({
  groupCode: z.string().trim().min(1).max(2).transform((value) => value.toUpperCase())
});

const groupStandingResultSchema = z.object({
  firstTeam: z.string().trim().min(1).max(100),
  secondTeam: z.string().trim().min(1).max(100),
  thirdTeam: z.string().trim().min(1).max(100),
  fourthTeam: z.string().trim().min(1).max(100)
});

const knockoutParamsSchema = z.object({
  matchNumber: z.coerce.number().int().min(73).max(104)
});

const knockoutMatchSchema = z.object({
  homeTeam: z.string().trim().min(1).max(100),
  awayTeam: z.string().trim().min(1).max(100)
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

  app.get("/knockout-matches", { preHandler: requireAdmin }, async () => {
    const [matches, teamOptions] = await Promise.all([
      prisma.match.findMany({
        where: {
          matchNumber: {
            gte: 73,
            lte: 104
          }
        },
        orderBy: { matchNumber: "asc" }
      }),
      getKnockoutTeamOptions()
    ]);

    const matchByNumber = new Map(matches.map((match) => [match.matchNumber, match]));

    return {
      teamOptions,
      matches: knockoutMatchTemplates.map((template) => {
        const match = matchByNumber.get(template.matchNumber);
        return {
          ...template,
          homeTeamOptions: getKnockoutSlotOptions(template.homeSlot, matchByNumber, teamOptions),
          awayTeamOptions: getKnockoutSlotOptions(template.awaySlot, matchByNumber, teamOptions),
          match: match ? { ...match, computedState: getComputedMatchState(match) } : null
        };
      })
    };
  });

  app.patch("/knockout-matches/:matchNumber", { preHandler: requireAdmin }, async (request, reply) => {
    const { matchNumber } = knockoutParamsSchema.parse(request.params);
    const body = knockoutMatchSchema.parse(request.body);
    const template = getKnockoutMatchTemplate(matchNumber);

    if (!template) {
      return reply.status(404).send({ message: "Jogo de mata-mata nao encontrado." });
    }

    if (body.homeTeam === body.awayTeam) {
      return reply.status(400).send({ message: "Selecione duas selecoes diferentes." });
    }

    const [teamOptions, knockoutMatches] = await Promise.all([
      getKnockoutTeamOptions(),
      prisma.match.findMany({
        where: {
          matchNumber: {
            gte: 73,
            lte: 104
          }
        }
      })
    ]);
    const matchByNumber = new Map(knockoutMatches.map((match) => [match.matchNumber, match]));
    const homeTeamOptions = getKnockoutSlotOptions(template.homeSlot, matchByNumber, teamOptions);
    const awayTeamOptions = getKnockoutSlotOptions(template.awaySlot, matchByNumber, teamOptions);

    if (!homeTeamOptions.includes(body.homeTeam) || !awayTeamOptions.includes(body.awayTeam)) {
      return reply.status(400).send({ message: getInvalidKnockoutSelectionMessage(template, homeTeamOptions, awayTeamOptions) });
    }

    const existingMatch = await prisma.match.findUnique({
      where: { matchNumber },
      include: {
        _count: {
          select: { predictions: true }
        }
      }
    });

    if (existingMatch?.status === "FINISHED") {
      return reply.status(400).send({ message: "Nao e possivel alterar um jogo ja finalizado." });
    }

    if (existingMatch && getComputedMatchState(existingMatch) !== "OPEN" && existingMatch._count.predictions > 0) {
      return reply.status(400).send({ message: "Este jogo ja fechou e possui palpites. Nao altere o confronto." });
    }

    const match = await prisma.match.upsert({
      where: { matchNumber },
      create: {
        matchNumber,
        homeTeam: body.homeTeam,
        awayTeam: body.awayTeam,
        groupCode: null,
        stage: template.stage,
        venue: "A definir",
        city: "A definir",
        matchDateUtc: new Date(template.matchDateUtc),
        lockAtUtc: getKnockoutLockAt(template.matchDateUtc, template.stage)
      },
      update: {
        homeTeam: body.homeTeam,
        awayTeam: body.awayTeam,
        groupCode: null,
        stage: template.stage,
        venue: "A definir",
        city: "A definir",
        matchDateUtc: new Date(template.matchDateUtc),
        lockAtUtc: getKnockoutLockAt(template.matchDateUtc, template.stage),
        status: "SCHEDULED",
        homeScore: null,
        awayScore: null
      }
    });

    return {
      match: {
        ...match,
        computedState: getComputedMatchState(match)
      }
    };
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
                nickname: true,
                avatarUrl: true
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

  app.patch("/bonus-window", { preHandler: requireAdmin }, async (request, reply) => {
    const body = bonusWindowSchema.parse(request.body);
    const lockAtUtc = body.mode === "OPEN" ? new Date(body.lockAtUtc) : new Date();

    if (body.mode === "OPEN" && lockAtUtc <= new Date()) {
      return reply.status(400).send({ message: "Informe uma data futura para reabrir os bônus." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const questions = await tx.bonusQuestion.updateMany({
        where: {
          isActive: true,
          correctAnswer: null
        },
        data: { lockAtUtc }
      });

      const groupControl = await tx.bonusControl.upsert({
        where: { key: groupStandingBonusControlKey },
        create: {
          key: groupStandingBonusControlKey,
          lockAtUtc
        },
        update: { lockAtUtc }
      });

      return { questionsUpdated: questions.count, groupControl };
    });

    return {
      lockAtUtc: result.groupControl.lockAtUtc,
      questionsUpdated: result.questionsUpdated,
      message: body.mode === "OPEN" ? "Bônus reabertos." : "Bônus fechados."
    };
  });

  app.get("/group-standings", { preHandler: requireAdmin }, async () => {
    const [groupMatches, predictions, results, groupControl] = await Promise.all([
      prisma.match.findMany({
        where: {
          stage: "GROUP_STAGE",
          groupCode: { not: null }
        },
        orderBy: [{ groupCode: "asc" }, { matchDateUtc: "asc" }]
      }),
      prisma.groupStandingPrediction.findMany(),
      prisma.groupStandingResult.findMany(),
      prisma.bonusControl.findUnique({ where: { key: groupStandingBonusControlKey } })
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
        const lockAtUtc = getGroupLockAt(matches, groupControl?.lockAtUtc) ?? new Date();
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

async function getKnockoutTeamOptions() {
  const groupMatches = await prisma.match.findMany({
    where: {
      stage: "GROUP_STAGE"
    },
    select: {
      homeTeam: true,
      awayTeam: true
    }
  });

  return Array.from(new Set(groupMatches.flatMap((match) => [match.homeTeam, match.awayTeam]))).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
}

function getKnockoutSlotOptions(slot: string, matchByNumber: Map<number, { homeTeam: string; awayTeam: string }>, fallbackTeamOptions: string[]) {
  const previousMatchNumber = getPreviousMatchNumber(slot);
  if (!previousMatchNumber) return fallbackTeamOptions;

  const previousMatch = matchByNumber.get(previousMatchNumber);
  if (!previousMatch) return [];

  return [previousMatch.homeTeam, previousMatch.awayTeam].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function getPreviousMatchNumber(slot: string) {
  const match = slot.match(/(?:jogo|semifinal)\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

function getInvalidKnockoutSelectionMessage(template: KnockoutMatchTemplate, homeTeamOptions: string[], awayTeamOptions: string[]) {
  if (homeTeamOptions.length === 0 || awayTeamOptions.length === 0) {
    return "Defina primeiro os confrontos da fase anterior.";
  }

  return `Selecione times válidos para ${template.homeSlot} e ${template.awaySlot}.`;
}
