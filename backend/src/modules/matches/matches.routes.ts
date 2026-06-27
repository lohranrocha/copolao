import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../plugins/prisma.js";
import { requireAdmin, requireAuth } from "../../utils/http.js";
import {
  canViewPublicPredictions,
  getComputedMatchState
} from "../../utils/matches.js";
import { calculatePredictionScore } from "../../utils/score.js";

const paramsSchema = z.object({
  matchId: z.string().uuid()
});

const resultSchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0)
});

type GroupTeamMatch = {
  groupCode: string | null;
  homeTeam: string;
  awayTeam: string;
};

export async function matchesRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireAuth }, async (request) => {
    const matches = await prisma.match.findMany({
      orderBy: [{ matchDateUtc: "asc" }, { matchNumber: "asc" }],
      include: {
        predictions: {
          where: { userId: request.user.sub },
          select: {
            id: true,
            homeScorePrediction: true,
            awayScorePrediction: true,
            points: true,
            isExactScore: true,
            isCorrectResult: true,
            updatedAt: true
          }
        }
      }
    });

    return {
      matches: matches.map((match) => ({
        ...match,
        computedState: getComputedMatchState(match),
        myPrediction: match.predictions[0] ?? null,
        predictions: undefined
      }))
    };
  });

  app.get("/qualified-teams", { preHandler: requireAuth }, async () => {
    const [groupMatches, groupResults] = await Promise.all([
      prisma.match.findMany({
        where: {
          stage: "GROUP_STAGE",
          groupCode: { not: null }
        },
        orderBy: [{ groupCode: "asc" }, { matchDateUtc: "asc" }],
        select: {
          groupCode: true,
          homeTeam: true,
          awayTeam: true
        }
      }),
      prisma.groupStandingResult.findMany({
        orderBy: { groupCode: "asc" }
      })
    ]);

    const matchesByGroup = new Map<string, GroupTeamMatch[]>();
    for (const match of groupMatches) {
      if (!match.groupCode) continue;
      matchesByGroup.set(match.groupCode, [...(matchesByGroup.get(match.groupCode) ?? []), match]);
    }

    const resultByGroup = new Map(groupResults.map((result) => [result.groupCode, result]));

    return {
      groups: Array.from(matchesByGroup.entries()).map(([groupCode, matches]) => {
        const result = resultByGroup.get(groupCode);

        return {
          groupCode,
          teams: getQualifiedGroupTeams(matches),
          result: result ?? null,
          directQualifiedTeams: result ? [result.firstTeam, result.secondTeam] : [],
          thirdPlacedTeam: result?.thirdTeam ?? null
        };
      })
    };
  });

  app.get("/:matchId/predictions", { preHandler: requireAuth }, async (request, reply) => {
    const { matchId } = paramsSchema.parse(request.params);
    const match = await prisma.match.findUnique({ where: { id: matchId } });

    if (!match) {
      return reply.status(404).send({ message: "Jogo nao encontrado." });
    }

    if (!canViewPublicPredictions(match)) {
      return reply.status(403).send({
        message: "Os palpites dos participantes ficam visiveis apenas apos o inicio do jogo."
      });
    }

    const predictions = await prisma.prediction.findMany({
      where: { matchId },
      orderBy: { updatedAt: "asc" },
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
    });

    return { predictions };
  });

  app.patch("/:matchId/result", { preHandler: requireAdmin }, async (request, reply) => {
    const { matchId } = paramsSchema.parse(request.params);
    const body = resultSchema.parse(request.body);

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return reply.status(404).send({ message: "Jogo nao encontrado." });
    }

    if (match.status === "CANCELLED") {
      return reply.status(400).send({ message: "Nao e possivel lancar resultado para jogo cancelado." });
    }

    const updatedMatch = await prisma.$transaction(async (tx) => {
      const savedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          homeScore: body.homeScore,
          awayScore: body.awayScore,
          status: "FINISHED"
        }
      });

      const predictions = await tx.prediction.findMany({ where: { matchId } });

      for (const prediction of predictions) {
        const score = calculatePredictionScore({
          homeScorePrediction: prediction.homeScorePrediction,
          awayScorePrediction: prediction.awayScorePrediction,
          homeScoreReal: body.homeScore,
          awayScoreReal: body.awayScore,
          stage: match.stage
        });

        await tx.prediction.update({
          where: { id: prediction.id },
          data: score
        });
      }

      return savedMatch;
    });

    return {
      match: {
        ...updatedMatch,
        computedState: getComputedMatchState(updatedMatch)
      }
    };
  });

  app.delete("/:matchId/result", { preHandler: requireAdmin }, async (request, reply) => {
    const { matchId } = paramsSchema.parse(request.params);

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return reply.status(404).send({ message: "Jogo nao encontrado." });
    }

    if (match.homeScore === null || match.awayScore === null) {
      return reply.status(400).send({ message: "Este jogo ainda nao tem resultado lancado." });
    }

    const updatedMatch = await prisma.$transaction(async (tx) => {
      const savedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          homeScore: null,
          awayScore: null,
          status: "SCHEDULED"
        }
      });

      await tx.prediction.updateMany({
        where: { matchId },
        data: {
          points: 0,
          isExactScore: false,
          isCorrectResult: false
        }
      });

      return savedMatch;
    });

    return {
      match: {
        ...updatedMatch,
        computedState: getComputedMatchState(updatedMatch)
      }
    };
  });
}

function getQualifiedGroupTeams(matches: GroupTeamMatch[]) {
  return Array.from(new Set(matches.flatMap((match) => [match.homeTeam, match.awayTeam]))).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
}
