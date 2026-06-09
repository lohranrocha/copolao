import type { Match } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { canViewPublicPredictions } from "./matches.js";

function makeMatch(input: Partial<Match>): Match {
  return {
    id: "match-id",
    matchNumber: 1,
    homeTeam: "Brasil",
    awayTeam: "Escocia",
    groupCode: "A",
    stage: "GROUP_STAGE",
    venue: "Estadio",
    city: "Cidade",
    matchDateUtc: new Date("2026-06-10T18:00:00.000Z"),
    lockAtUtc: new Date("2026-06-10T17:30:00.000Z"),
    homeScore: null,
    awayScore: null,
    status: "SCHEDULED",
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-01T00:00:00.000Z"),
    ...input
  };
}

describe("canViewPublicPredictions", () => {
  it("keeps predictions private before kickoff even if a result was launched", () => {
    const match = makeMatch({
      homeScore: 2,
      awayScore: 1,
      status: "FINISHED"
    });

    expect(canViewPublicPredictions(match, new Date("2026-06-10T17:59:59.000Z"))).toBe(false);
  });

  it("allows public predictions after kickoff", () => {
    const match = makeMatch({});

    expect(canViewPublicPredictions(match, new Date("2026-06-10T18:00:00.000Z"))).toBe(true);
  });

  it("keeps cancelled matches private", () => {
    const match = makeMatch({ status: "CANCELLED" });

    expect(canViewPublicPredictions(match, new Date("2026-06-10T18:00:00.000Z"))).toBe(false);
  });
});
