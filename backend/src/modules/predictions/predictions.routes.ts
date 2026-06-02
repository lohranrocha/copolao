import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../plugins/prisma.js";
import { requireAuth } from "../../utils/http.js";
import { canPredict, getComputedMatchState } from "../../utils/matches.js";

const paramsSchema = z.object({
  matchId: z.string().uuid()
});

const predictionSchema = z.object({
  homeScorePrediction: z.number().int().min(0).max(99),
  awayScorePrediction: z.number().int().min(0).max(99)
});

export async function predictionsRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: requireAuth }, async (request) => {
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
        message: "Os palpites deste jogo ja foram fechados. O limite e 1 hora antes da partida."
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
