import { describe, expect, it } from "vitest";
import { isBonusAnswerCorrect } from "./bonus.js";

describe("bonus answer scoring", () => {
  it("accepts any listed correct answer", () => {
    expect(isBonusAnswerCorrect("França", "França; Inglaterra")).toBe(true);
    expect(isBonusAnswerCorrect("INGLATERRA", "França; Inglaterra")).toBe(true);
    expect(isBonusAnswerCorrect("Franca", "França; Inglaterra")).toBe(true);
    expect(isBonusAnswerCorrect("Espanha", "França; Inglaterra")).toBe(false);
  });
});
