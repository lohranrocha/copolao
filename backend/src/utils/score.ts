type ScoreResult = "HOME_WIN" | "AWAY_WIN" | "DRAW";

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
}) {
  const exact =
    input.homeScorePrediction === input.homeScoreReal &&
    input.awayScorePrediction === input.awayScoreReal;

  if (exact) {
    return {
      points: 3,
      isExactScore: true,
      isCorrectResult: true
    };
  }

  const predictionResult = getResult(input.homeScorePrediction, input.awayScorePrediction);
  const realResult = getResult(input.homeScoreReal, input.awayScoreReal);
  const correctResult = predictionResult === realResult;

  return {
    points: correctResult ? 1 : 0,
    isExactScore: false,
    isCorrectResult: correctResult
  };
}
