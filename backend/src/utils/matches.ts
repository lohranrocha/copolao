import type { Match } from "@prisma/client";

export type ComputedMatchState = "OPEN" | "LOCKED" | "FINISHED" | "CANCELLED";

export function getComputedMatchState(match: Match, now = new Date()): ComputedMatchState {
  if (match.status === "CANCELLED") return "CANCELLED";
  if (match.status === "FINISHED" || (match.homeScore !== null && match.awayScore !== null)) {
    return "FINISHED";
  }
  if (now >= match.lockAtUtc) return "LOCKED";
  return "OPEN";
}

export function canPredict(match: Match, now = new Date()) {
  return getComputedMatchState(match, now) === "OPEN";
}

export function canViewPublicPredictions(match: Match, now = new Date()) {
  return now >= match.matchDateUtc || getComputedMatchState(match, now) === "FINISHED";
}
