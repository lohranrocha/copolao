import type { Match } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { getGroupLockAt } from "./groupStandings.js";

function makeMatch(input: Partial<Match>): Match {
  return {
    id: "match-id",
    matchNumber: 1,
    homeTeam: "Mexico",
    awayTeam: "Africa do Sul",
    groupCode: "A",
    stage: "GROUP_STAGE",
    venue: "Estadio",
    city: "Cidade",
    matchDateUtc: new Date("2026-06-11T18:00:00.000Z"),
    lockAtUtc: new Date("2026-06-11T17:30:00.000Z"),
    homeScore: null,
    awayScore: null,
    status: "SCHEDULED",
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-01T00:00:00.000Z"),
    ...input
  };
}

describe("getGroupLockAt", () => {
  it("keeps group standing bonuses open until the 15:30 BRT extension", () => {
    const lockAt = getGroupLockAt([makeMatch({})]);

    expect(lockAt?.toISOString()).toBe("2026-06-11T18:30:00.000Z");
  });

  it("keeps later group locks unchanged", () => {
    const lockAt = getGroupLockAt([
      makeMatch({
        matchDateUtc: new Date("2026-06-12T19:00:00.000Z"),
        lockAtUtc: new Date("2026-06-12T18:30:00.000Z")
      })
    ]);

    expect(lockAt?.toISOString()).toBe("2026-06-12T18:30:00.000Z");
  });

  it("uses the admin bonus window when one is configured", () => {
    const lockAt = getGroupLockAt([makeMatch({})], new Date("2026-06-15T18:30:00.000Z"));

    expect(lockAt?.toISOString()).toBe("2026-06-15T18:30:00.000Z");
  });
});
