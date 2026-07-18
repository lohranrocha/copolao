import type { MatchStage } from "@prisma/client";

export type KnockoutMatchTemplate = {
  matchNumber: number;
  stage: Exclude<MatchStage, "GROUP_STAGE">;
  label: string;
  homeSlot: string;
  awaySlot: string;
  matchDateUtc: string;
};

export const knockoutMatchTemplates: KnockoutMatchTemplate[] = [
  template(73, "ROUND_OF_32", "16 avos", "2º do Grupo A", "2º do Grupo B", "2026-06-28T19:00:00.000Z"),
  template(74, "ROUND_OF_32", "16 avos", "1º do Grupo E", "Melhor 3º", "2026-06-29T20:30:00.000Z"),
  template(75, "ROUND_OF_32", "16 avos", "1º do Grupo F", "2º do Grupo C", "2026-06-30T01:00:00.000Z"),
  template(76, "ROUND_OF_32", "16 avos", "1º do Grupo C", "2º do Grupo F", "2026-06-29T17:00:00.000Z"),
  template(77, "ROUND_OF_32", "16 avos", "1º do Grupo I", "Melhor 3º", "2026-06-30T21:00:00.000Z"),
  template(78, "ROUND_OF_32", "16 avos", "2º do Grupo E", "2º do Grupo I", "2026-06-30T17:00:00.000Z"),
  template(79, "ROUND_OF_32", "16 avos", "1º do Grupo A", "Melhor 3º", "2026-07-01T01:00:00.000Z"),
  template(80, "ROUND_OF_32", "16 avos", "1º do Grupo L", "Melhor 3º", "2026-07-01T16:00:00.000Z"),
  template(81, "ROUND_OF_32", "16 avos", "1º do Grupo D", "Melhor 3º", "2026-07-02T00:00:00.000Z"),
  template(82, "ROUND_OF_32", "16 avos", "1º do Grupo G", "Melhor 3º", "2026-07-01T20:00:00.000Z"),
  template(83, "ROUND_OF_32", "16 avos", "2º do Grupo K", "2º do Grupo L", "2026-07-02T23:00:00.000Z"),
  template(84, "ROUND_OF_32", "16 avos", "1º do Grupo H", "2º do Grupo J", "2026-07-02T19:00:00.000Z"),
  template(85, "ROUND_OF_32", "16 avos", "1º do Grupo B", "Melhor 3º", "2026-07-03T03:00:00.000Z"),
  template(86, "ROUND_OF_32", "16 avos", "1º do Grupo J", "2º do Grupo H", "2026-07-03T22:00:00.000Z"),
  template(87, "ROUND_OF_32", "16 avos", "1º do Grupo K", "Melhor 3º", "2026-07-04T01:30:00.000Z"),
  template(88, "ROUND_OF_32", "16 avos", "2º do Grupo D", "2º do Grupo G", "2026-07-03T18:00:00.000Z"),
  template(89, "ROUND_OF_16", "Oitavas", "Vencedor do jogo 73", "Vencedor do jogo 75", "2026-07-04T17:00:00.000Z"),
  template(90, "ROUND_OF_16", "Oitavas", "Vencedor do jogo 74", "Vencedor do jogo 77", "2026-07-04T21:00:00.000Z"),
  template(91, "ROUND_OF_16", "Oitavas", "Vencedor do jogo 76", "Vencedor do jogo 78", "2026-07-05T20:00:00.000Z"),
  template(92, "ROUND_OF_16", "Oitavas", "Vencedor do jogo 79", "Vencedor do jogo 80", "2026-07-06T00:00:00.000Z"),
  template(93, "ROUND_OF_16", "Oitavas", "Vencedor do jogo 83", "Vencedor do jogo 84", "2026-07-06T19:00:00.000Z"),
  template(94, "ROUND_OF_16", "Oitavas", "Vencedor do jogo 81", "Vencedor do jogo 82", "2026-07-07T00:00:00.000Z"),
  template(95, "ROUND_OF_16", "Oitavas", "Vencedor do jogo 86", "Vencedor do jogo 88", "2026-07-07T16:00:00.000Z"),
  template(96, "ROUND_OF_16", "Oitavas", "Vencedor do jogo 85", "Vencedor do jogo 87", "2026-07-07T20:00:00.000Z"),
  template(97, "QUARTER_FINAL", "Quartas", "Vencedor do jogo 89", "Vencedor do jogo 90", "2026-07-09T20:00:00.000Z"),
  template(98, "QUARTER_FINAL", "Quartas", "Vencedor do jogo 93", "Vencedor do jogo 94", "2026-07-10T19:00:00.000Z"),
  template(99, "QUARTER_FINAL", "Quartas", "Vencedor do jogo 91", "Vencedor do jogo 92", "2026-07-11T21:00:00.000Z"),
  template(100, "QUARTER_FINAL", "Quartas", "Vencedor do jogo 95", "Vencedor do jogo 96", "2026-07-12T01:00:00.000Z"),
  template(101, "SEMI_FINAL", "Semifinais", "Vencedor do jogo 97", "Vencedor do jogo 98", "2026-07-14T19:00:00.000Z"),
  template(102, "SEMI_FINAL", "Semifinais", "Vencedor do jogo 99", "Vencedor do jogo 100", "2026-07-15T19:00:00.000Z"),
  template(103, "THIRD_PLACE", "3º lugar", "Perdedor da semifinal 101", "Perdedor da semifinal 102", "2026-07-18T21:00:00.000Z"),
  template(104, "FINAL", "Final", "Vencedor da semifinal 101", "Vencedor da semifinal 102", "2026-07-19T19:00:00.000Z")
];

export function getKnockoutMatchTemplate(matchNumber: number) {
  return knockoutMatchTemplates.find((match) => match.matchNumber === matchNumber) ?? null;
}

export function getKnockoutLockAt(matchDateUtc: string, stage: KnockoutMatchTemplate["stage"]) {
  const lockMinutesBeforeKickoff = stage === "THIRD_PLACE" || stage === "FINAL" ? 15 : 30;
  return new Date(new Date(matchDateUtc).getTime() - lockMinutesBeforeKickoff * 60 * 1000);
}

function template(
  matchNumber: number,
  stage: KnockoutMatchTemplate["stage"],
  label: string,
  homeSlot: string,
  awaySlot: string,
  matchDateUtc: string
): KnockoutMatchTemplate {
  return { matchNumber, stage, label, homeSlot, awaySlot, matchDateUtc };
}
