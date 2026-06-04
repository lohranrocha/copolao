import type { GroupStandingPrediction, Match } from "@prisma/client";

export type GroupStandingState = "OPEN" | "LOCKED" | "SETTLED";

export type GroupStandingInput = {
  firstTeam: string;
  secondTeam: string;
  thirdTeam: string;
  fourthTeam: string;
};

export function getGroupTeams(matches: Match[]) {
  return Array.from(new Set(matches.flatMap((match) => [match.homeTeam, match.awayTeam]))).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
}

export function getGroupLockAt(matches: Match[]) {
  return matches.reduce<Date | null>((earliest, match) => {
    if (!earliest || match.lockAtUtc < earliest) return match.lockAtUtc;
    return earliest;
  }, null);
}

export function getGroupStandingState(lockAtUtc: Date, hasResult: boolean, now = new Date()): GroupStandingState {
  if (hasResult) return "SETTLED";
  if (now >= lockAtUtc) return "LOCKED";
  return "OPEN";
}

export function standingToArray(standing: GroupStandingInput) {
  return [standing.firstTeam, standing.secondTeam, standing.thirdTeam, standing.fourthTeam];
}

export function validateStandingTeams(input: GroupStandingInput, validTeams: string[]) {
  const values = standingToArray(input);
  const uniqueValues = new Set(values);

  if (values.some((team) => !validTeams.includes(team))) {
    return false;
  }

  return uniqueValues.size === 4 && values.length === validTeams.length;
}

export function calculateGroupStandingScore(prediction: GroupStandingPrediction, result: GroupStandingInput) {
  const predicted = standingToArray(prediction);
  const official = standingToArray(result);
  const correctPositions = predicted.filter((team, index) => team === official[index]).length;

  return {
    correctPositions,
    isPerfect: correctPositions === 4,
    points: correctPositions + (correctPositions === 4 ? 1 : 0)
  };
}
