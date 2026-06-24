import type { MatchStage } from "@prisma/client";

type ScoreResult = "HOME_WIN" | "AWAY_WIN" | "DRAW";

const knockoutResultPoints: Record<Exclude<MatchStage, "GROUP_STAGE">, number> = {
  ROUND_OF_32: 2,
  ROUND_OF_16: 2,
  QUARTER_FINAL: 4,
  SEMI_FINAL: 5,
  THIRD_PLACE: 5,
  FINAL: 8
};

function getResult(homeScore: number, awayScore: number): ScoreResult {
  if (homeScore > awayScore) return "HOME_WIN";
  if (homeScore < awayScore) return "AWAY_WIN";
  return "DRAW";
}

export function calculatePredictionScore(input: {
  homeScorePrediction: number;
  awayScorePrediction: number;
  homeScoreReal: number;
  awayScoreReal: number;
  stage?: MatchStage;
}) {
  const stage = input.stage ?? "GROUP_STAGE";
  const exact =
    input.homeScorePrediction === input.homeScoreReal &&
    input.awayScorePrediction === input.awayScoreReal;

  if (exact) {
    return {
      points: stage === "GROUP_STAGE" ? 3 : knockoutResultPoints[stage] + 3,
      isExactScore: true,
      isCorrectResult: true
    };
  }

  const predictionResult = getResult(input.homeScorePrediction, input.awayScorePrediction);
  const realResult = getResult(input.homeScoreReal, input.awayScoreReal);
  const correctResult = predictionResult === realResult;
  const resultPoints = stage === "GROUP_STAGE" ? 1 : knockoutResultPoints[stage];

  return {
    points: correctResult ? resultPoints : 0,
    isExactScore: false,
    isCorrectResult: correctResult
  };
}
