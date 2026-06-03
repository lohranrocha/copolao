import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../plugins/prisma.js";
import { requireAuth } from "../../utils/http.js";
import { canPredict, canViewPublicPredictions, getComputedMatchState } from "../../utils/matches.js";

const paramsSchema = z.object({
  matchId: z.string().uuid()
});

const predictionSchema = z.object({
  homeScorePrediction: z.number().int().min(0).max(99),
  awayScorePrediction: z.number().int().min(0).max(99)
});

export async function predictionsRoutes(app: FastifyInstance) {
  app.get("/predictions/board", { preHandler: requireAuth }, async (request) => {
    const [participants, matches] = await Promise.all([
      prisma.user.findMany({
        where: { role: "PARTICIPANT" },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          nickname: true
        }
      }),
      prisma.match.findMany({
        orderBy: [{ matchDateUtc: "asc" }, { matchNumber: "asc" }],
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
      })
    ]);

    const rows = matches.map((match) => {
      const isPublic = canViewPublicPredictions(match);
      const viewerCanSeePredictions = request.user.role === "ADMIN" || isPublic;
      const predictions = match.predictions.map((prediction) => {
        const isOwnPrediction = prediction.userId === request.user.sub;

        if (!viewerCanSeePredictions && !isOwnPrediction) {
          return {
            userId: prediction.userId,
            user: prediction.user,
            hidden: true
          };
        }

        return {
          userId: prediction.userId,
          user: prediction.user,
          hidden: false,
          homeScorePrediction: prediction.homeScorePrediction,
          awayScorePrediction: prediction.awayScorePrediction,
          points: prediction.points,
          isExactScore: prediction.isExactScore,
          isCorrectResult: prediction.isCorrectResult
        };
      });

      return {
        id: match.id,
        matchNumber: match.matchNumber,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        groupCode: match.groupCode,
        stage: match.stage,
        matchDateUtc: match.matchDateUtc,
        lockAtUtc: match.lockAtUtc,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        computedState: getComputedMatchState(match),
        isPublic,
        viewerCanSeePredictions,
        predictions
      };
    });

    return {
      participants,
      matches: rows
    };
  });

  app.get("/predictions/me", { preHandler: requireAuth }, async (request) => {
    const predictions = await prisma.prediction.findMany({
      where: { userId: request.user.sub },
      orderBy: { match: { matchDateUtc: "asc" } },
      include: {
        match: true
      }
    });

    return {
      predictions: predictions.map((prediction) => ({
        ...prediction,
        match: {
          ...prediction.match,
          computedState: getComputedMatchState(prediction.match)
        }
      }))
    };
  });

  app.put("/matches/:matchId/prediction", { preHandler: requireAuth }, async (request, reply) => {
    const { matchId } = paramsSchema.parse(request.params);
    const body = predictionSchema.parse(request.body);

    const match = await prisma.match.findUnique({ where: { id: matchId } });

    if (!match) {
      return reply.status(404).send({ message: "Jogo nao encontrado." });
    }

    if (!canPredict(match)) {
      return reply.status(400).send({
        message: "Os palpites deste jogo ja foram fechados. O limite e 30 minutos antes da partida."
      });
    }

    const prediction = await prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId: request.user.sub,
          matchId
        }
      },
      create: {
        userId: request.user.sub,
        matchId,
        homeScorePrediction: body.homeScorePrediction,
        awayScorePrediction: body.awayScorePrediction
      },
      update: {
        homeScorePrediction: body.homeScorePrediction,
        awayScorePrediction: body.awayScorePrediction
      }
    });

    return { prediction };
  });
}
