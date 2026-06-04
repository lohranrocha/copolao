import type { FastifyInstance } from "fastify";
import { prisma } from "../../plugins/prisma.js";
import { requireAdmin, requireAuth } from "../../utils/http.js";
import { calculatePredictionScore } from "../../utils/score.js";

async function buildRanking() {
  const now = new Date();
  const lockedMatchesCount = await prisma.match.count({
    where: {
      status: { not: "CANCELLED" },
      lockAtUtc: { lte: now }
    }
  });

  const participants = await prisma.user.findMany({
    where: { role: "PARTICIPANT" },
    orderBy: { name: "asc" },
    include: {
      predictions: {
        include: {
          match: true
        }
      },
      bonusPredictions: true,
      groupPredictions: true
    }
  });

  const ranking = participants.map((user) => {
    const finishedPredictions = user.predictions.filter(
      (prediction) => prediction.match.status === "FINISHED"
    );
    const lockedPredictionsCount = user.predictions.filter(
      (prediction) => prediction.match.lockAtUtc <= now && prediction.match.status !== "CANCELLED"
    ).length;

    const matchPoints = finishedPredictions.reduce((sum, prediction) => sum + prediction.points, 0);
    const bonusPoints =
      user.bonusPredictions.reduce((sum, prediction) => sum + prediction.points, 0) +
      user.groupPredictions.reduce((sum, prediction) => sum + prediction.points, 0);

    return {
      user: {
        id: user.id,
        name: user.name,
        nickname: user.nickname
      },
      totalPoints: matchPoints + bonusPoints,
      matchPoints,
      bonusPoints,
      exactScores: finishedPredictions.filter((prediction) => prediction.isExactScore).length,
      correctResults: finishedPredictions.filter((prediction) => prediction.isCorrectResult).length,
      missedPredictions: Math.max(lockedMatchesCount - lockedPredictionsCount, 0)
    };
  });

  ranking.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
    if (b.correctResults !== a.correctResults) return b.correctResults - a.correctResults;
    if (a.missedPredictions !== b.missedPredictions) return a.missedPredictions - b.missedPredictions;
    return a.user.name.localeCompare(b.user.name, "pt-BR");
  });

  return ranking.map((entry, index) => ({
    position: index + 1,
    ...entry
  }));
}

async function recalculateFinishedMatches() {
  const matches = await prisma.match.findMany({
    where: {
      status: "FINISHED",
      homeScore: { not: null },
      awayScore: { not: null }
    },
    include: {
      predictions: true
    }
  });

  for (const match of matches) {
    for (const prediction of match.predictions) {
      const score = calculatePredictionScore({
        homeScorePrediction: prediction.homeScorePrediction,
        awayScorePrediction: prediction.awayScorePrediction,
        homeScoreReal: match.homeScore ?? 0,
        awayScoreReal: match.awayScore ?? 0
      });

      await prisma.prediction.update({
        where: { id: prediction.id },
        data: score
      });
    }
  }

  return matches.length;
}

export async function rankingRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireAuth }, async () => {
    return { ranking: await buildRanking() };
  });

  app.post("/recalculate", { preHandler: requireAdmin }, async () => {
    const recalculatedMatches = await recalculateFinishedMatches();
    return {
      recalculatedMatches,
      ranking: await buildRanking()
    };
  });
}
