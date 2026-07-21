import type { BonusQuestion } from "@prisma/client";

export type BonusQuestionState = "OPEN" | "LOCKED" | "SETTLED";

export function normalizeBonusAnswer(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function isBonusAnswerCorrect(answer: string, correctAnswer: string) {
  const normalizedAnswer = normalizeBonusAnswer(answer);
  return getAcceptedBonusAnswers(correctAnswer).some((acceptedAnswer) => normalizedAnswer === acceptedAnswer);
}

function getAcceptedBonusAnswers(correctAnswer: string) {
  return correctAnswer
    .split(/\s*(?:;|,|\/|\||\bou\b)\s*/i)
    .map(normalizeBonusAnswer)
    .filter(Boolean);
}

export function getBonusQuestionState(question: BonusQuestion, now = new Date()): BonusQuestionState {
  if (question.correctAnswer) return "SETTLED";
  if (now >= question.lockAtUtc) return "LOCKED";
  return "OPEN";
}

export function canPredictBonus(question: BonusQuestion, now = new Date()) {
  return question.isActive && getBonusQuestionState(question, now) === "OPEN";
}
