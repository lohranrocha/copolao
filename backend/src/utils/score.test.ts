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

  it.each([
    ["ROUND_OF_32", 2],
    ["ROUND_OF_16", 2],
    ["QUARTER_FINAL", 4],
    ["SEMI_FINAL", 5],
    ["THIRD_PLACE", 5],
    ["FINAL", 8]
  ] as const)("returns the stage points for a correct %s result", (stage, points) => {
    expect(
      calculatePredictionScore({
        homeScorePrediction: 1,
        awayScorePrediction: 0,
        homeScoreReal: 2,
        awayScoreReal: 1,
        stage
      })
    ).toEqual({
      points,
      isExactScore: false,
      isCorrectResult: true
    });
  });

  it.each([
    ["ROUND_OF_32", 5],
    ["ROUND_OF_16", 5],
    ["QUARTER_FINAL", 7],
    ["SEMI_FINAL", 8],
    ["THIRD_PLACE", 8],
    ["FINAL", 11]
  ] as const)("adds 3 points for an exact %s score", (stage, points) => {
    expect(
      calculatePredictionScore({
        homeScorePrediction: 2,
        awayScorePrediction: 1,
        homeScoreReal: 2,
        awayScoreReal: 1,
        stage
      })
    ).toEqual({
      points,
      isExactScore: true,
      isCorrectResult: true
    });
  });
});
