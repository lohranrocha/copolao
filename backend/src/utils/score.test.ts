import { describe, expect, it } from "vitest";
import { calculatePredictionScore } from "./score.js";

describe("calculatePredictionScore", () => {
  it("returns 3 points for exact score", () => {
    expect(
      calculatePredictionScore({
        homeScorePrediction: 2,
        awayScorePrediction: 1,
        homeScoreReal: 2,
        awayScoreReal: 1
      })
    ).toEqual({
      points: 3,
      isExactScore: true,
      isCorrectResult: true
    });
  });

  it("returns 1 point for correct result", () => {
    expect(
      calculatePredictionScore({
        homeScorePrediction: 1,
        awayScorePrediction: 0,
        homeScoreReal: 2,
        awayScoreReal: 1
      })
    ).toEqual({
      points: 1,
      isExactScore: false,
      isCorrectResult: true
    });
  });

  it("returns 0 points for wrong result", () => {
    expect(
      calculatePredictionScore({
        homeScorePrediction: 1,
        awayScorePrediction: 1,
        homeScoreReal: 2,
        awayScoreReal: 1
      })
    ).toEqual({
      points: 0,
      isExactScore: false,
      isCorrectResult: false
    });
  });
});
