import { useState } from "react";
import { CalendarClock, CheckCircle2, ChevronRight, Clock3, LockKeyhole, Target, Trophy } from "lucide-react";
import clsx from "clsx";
import { TeamFlag } from "./TeamFlag";
import type { Match } from "../types/domain";
import { formatDateTimeBR } from "../utils/date";
import { matchStateLabel, matchStateTone } from "../utils/match";
import { getTeamAsset } from "../utils/teamAssets";

type KnockoutRoundId = "ROUND_OF_32" | "ROUND_OF_16" | "QUARTER_FINAL" | "SEMI_FINAL" | "FINALS";

type KnockoutMatch = {
  number: number;
  dateUtc: string;
  home: string;
  away: string;
  points: number;
  accent?: "bronze" | "final";
};

type KnockoutRound = {
  id: KnockoutRoundId;
  shortLabel: string;
  label: string;
  matches: KnockoutMatch[];
};

const knockoutRounds: KnockoutRound[] = [
  {
    id: "ROUND_OF_32",
    shortLabel: "16 avos",
    label: "16 avos de final",
    matches: [
      knockoutMatch(73, "2026-06-28T19:00:00.000Z", "2º do Grupo A", "2º do Grupo B"),
      knockoutMatch(74, "2026-06-29T17:00:00.000Z", "1º do Grupo E", "Melhor 3º de A/B/C/D/F"),
      knockoutMatch(75, "2026-06-29T20:30:00.000Z", "1º do Grupo F", "2º do Grupo C"),
      knockoutMatch(76, "2026-06-30T01:00:00.000Z", "1º do Grupo C", "2º do Grupo F"),
      knockoutMatch(77, "2026-06-30T17:00:00.000Z", "1º do Grupo I", "Melhor 3º de C/D/F/G/H"),
      knockoutMatch(78, "2026-06-30T21:00:00.000Z", "2º do Grupo E", "2º do Grupo I"),
      knockoutMatch(79, "2026-07-01T01:00:00.000Z", "1º do Grupo A", "Melhor 3º de C/E/F/H/I"),
      knockoutMatch(80, "2026-07-01T16:00:00.000Z", "1º do Grupo L", "Melhor 3º de E/H/I/J/K"),
      knockoutMatch(81, "2026-07-01T23:00:00.000Z", "1º do Grupo D", "Melhor 3º de B/E/F/I/J"),
      knockoutMatch(82, "2026-07-02T02:30:00.000Z", "1º do Grupo G", "Melhor 3º de A/E/H/I/J"),
      knockoutMatch(83, "2026-07-02T19:00:00.000Z", "2º do Grupo K", "2º do Grupo L"),
      knockoutMatch(84, "2026-07-02T23:00:00.000Z", "1º do Grupo H", "2º do Grupo J"),
      knockoutMatch(85, "2026-07-03T02:00:00.000Z", "1º do Grupo B", "Melhor 3º de E/F/G/I/J"),
      knockoutMatch(86, "2026-07-03T18:00:00.000Z", "1º do Grupo J", "2º do Grupo H"),
      knockoutMatch(87, "2026-07-03T22:00:00.000Z", "1º do Grupo K", "Melhor 3º de D/E/I/J/L"),
      knockoutMatch(88, "2026-07-04T00:30:00.000Z", "2º do Grupo D", "2º do Grupo G")
    ]
  },
  {
    id: "ROUND_OF_16",
    shortLabel: "Oitavas",
    label: "Oitavas de final",
    matches: [
      knockoutMatch(89, "2026-07-04T17:00:00.000Z", "Vencedor do jogo 73", "Vencedor do jogo 75"),
      knockoutMatch(90, "2026-07-04T21:00:00.000Z", "Vencedor do jogo 74", "Vencedor do jogo 77"),
      knockoutMatch(91, "2026-07-05T20:00:00.000Z", "Vencedor do jogo 76", "Vencedor do jogo 78"),
      knockoutMatch(92, "2026-07-06T00:00:00.000Z", "Vencedor do jogo 79", "Vencedor do jogo 80"),
      knockoutMatch(93, "2026-07-06T19:00:00.000Z", "Vencedor do jogo 83", "Vencedor do jogo 84"),
      knockoutMatch(94, "2026-07-07T00:00:00.000Z", "Vencedor do jogo 81", "Vencedor do jogo 82"),
      knockoutMatch(95, "2026-07-07T16:00:00.000Z", "Vencedor do jogo 86", "Vencedor do jogo 88"),
      knockoutMatch(96, "2026-07-07T20:00:00.000Z", "Vencedor do jogo 85", "Vencedor do jogo 87")
    ]
  },
  {
    id: "QUARTER_FINAL",
    shortLabel: "Quartas",
    label: "Quartas de final",
    matches: [
      knockoutMatch(97, "2026-07-09T20:00:00.000Z", "Vencedor do jogo 89", "Vencedor do jogo 90"),
      knockoutMatch(98, "2026-07-10T00:00:00.000Z", "Vencedor do jogo 93", "Vencedor do jogo 94"),
      knockoutMatch(99, "2026-07-10T19:00:00.000Z", "Vencedor do jogo 91", "Vencedor do jogo 92"),
      knockoutMatch(100, "2026-07-11T00:00:00.000Z", "Vencedor do jogo 95", "Vencedor do jogo 96")
    ]
  },
  {
    id: "SEMI_FINAL",
    shortLabel: "Semis",
    label: "Semifinais",
    matches: [
      knockoutMatch(101, "2026-07-14T19:00:00.000Z", "Vencedor do jogo 97", "Vencedor do jogo 98"),
      knockoutMatch(102, "2026-07-15T19:00:00.000Z", "Vencedor do jogo 99", "Vencedor do jogo 100")
    ]
  },
  {
    id: "FINALS",
    shortLabel: "Finais",
    label: "Finais",
    matches: [
      { ...knockoutMatch(103, "2026-07-18T21:00:00.000Z", "Perdedor da semifinal 101", "Perdedor da semifinal 102"), accent: "bronze" },
      { ...knockoutMatch(104, "2026-07-19T19:00:00.000Z", "Vencedor da semifinal 101", "Vencedor da semifinal 102"), accent: "final" }
    ]
  }
];

export function KnockoutPreview({ confirmedMatches = [] }: { confirmedMatches?: Match[] }) {
  const [activeRoundId, setActiveRoundId] = useState<KnockoutRoundId>("ROUND_OF_32");
  const activeRound = knockoutRounds.find((round) => round.id === activeRoundId) ?? knockoutRounds[0];
  const confirmedMatchByNumber = new Map(confirmedMatches.map((match) => [match.matchNumber, match]));

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-limebet/20 bg-felt text-white shadow-glow">
        <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-limebet">
              <Trophy size={16} />
              Caminho até a taça
            </div>
            <h2 className="mt-2 text-2xl font-black">Chaveamento da Copa</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              As vagas serão substituídas pelas seleções classificadas. Confrontos com melhores terceiros dependem da combinação final dos oito classificados.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <SummaryStat value="32" label="seleções" />
            <SummaryStat value="32" label="partidas" />
          </div>
        </div>

        <div className="grid gap-px bg-white/10 sm:grid-cols-3">
          <RuleStat icon={CheckCircle2} value="2–8 pts" label="resultado correto, conforme a fase" />
          <RuleStat icon={Target} value="+3 pts" label="bônus adicional pelo placar exato" />
          <RuleStat icon={Clock3} value="90 min" label="placar considerado para a pontuação" />
        </div>
      </section>

      <ScoringTable />

      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {knockoutRounds.map((round) => (
          <button
            key={round.id}
            className={clsx(
              "h-10 shrink-0 rounded-lg border px-4 text-sm font-black transition",
              activeRound.id === round.id
                ? "border-limebet bg-limebet text-ink shadow-glow"
                : "border-white/10 bg-felt text-steel"
            )}
            type="button"
            onClick={() => setActiveRoundId(round.id)}
          >
            {round.shortLabel}
          </button>
        ))}
      </div>

      <section className="lg:hidden">
        <RoundHeading round={activeRound} />
        <div className="mt-3 space-y-3">
          {activeRound.matches.map((match) => (
            <KnockoutMatchCard key={match.number} match={match} confirmedMatch={confirmedMatchByNumber.get(match.number)} />
          ))}
        </div>
      </section>

      <section className="hidden lg:block">
        <div className="overflow-x-auto pb-3">
          <div className="grid min-w-[1360px] grid-cols-[250px_250px_250px_250px_250px] gap-6">
            {knockoutRounds.map((round) => (
              <div key={round.id} className="min-w-0">
                <RoundHeading round={round} />
                <div className={clsx("mt-3 flex flex-col", desktopRoundSpacing(round.id))}>
                  {round.matches.map((match) => (
                    <div key={match.number} className="relative">
                      <KnockoutMatchCard match={match} confirmedMatch={confirmedMatchByNumber.get(match.number)} compact />
                      {round.id !== "FINALS" ? (
                        <ChevronRight className="absolute -right-[22px] top-1/2 -translate-y-1/2 text-limebet/45" size={17} />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-lg border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
        <LockKeyhole className="mt-0.5 shrink-0" size={18} />
        <p>
          Os palpites serão liberados somente quando as duas seleções estiverem confirmadas. No mata-mata, o palpite vale pelo placar ao fim dos 90 minutos.
        </p>
      </div>
    </div>
  );
}

function knockoutMatch(number: number, dateUtc: string, home: string, away: string): KnockoutMatch {
  return { number, dateUtc, home, away, points: knockoutMatchPoints(number) };
}

function SummaryStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-24 rounded-lg border border-white/10 bg-ink px-3 py-2">
      <p className="text-xl font-black text-limebet">{value}</p>
      <p className="text-[10px] font-bold uppercase text-steel">{label}</p>
    </div>
  );
}

function RuleStat({
  icon: Icon,
  value,
  label
}: {
  icon: typeof Target;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-felt px-4 py-3">
      <Icon className="shrink-0 text-limebet" size={19} />
      <div>
        <p className="text-sm font-black text-white">{value}</p>
        <p className="text-xs text-steel">{label}</p>
      </div>
    </div>
  );
}

function RoundHeading({ round }: { round: KnockoutRound }) {
  const points = Array.from(new Set(round.matches.map((match) => match.points)));

  return (
    <div className="flex items-end justify-between gap-2 border-b border-white/10 pb-2">
      <div>
        <p className="text-[10px] font-black uppercase text-limebet">{round.matches.length} jogos</p>
        <h3 className="text-base font-black text-white">{round.label}</h3>
      </div>
      <div className="text-right">
        <span className="block text-xs font-black text-limebet">{points.join("–")} pts</span>
        <span className="text-[10px] font-bold text-steel">{round.matches[0]?.number}–{round.matches.at(-1)?.number}</span>
      </div>
    </div>
  );
}

function KnockoutMatchCard({
  match,
  confirmedMatch,
  compact = false
}: {
  match: KnockoutMatch;
  confirmedMatch?: Match;
  compact?: boolean;
}) {
  const finalMatch = match.accent === "final";
  const bronzeMatch = match.accent === "bronze";
  const home = confirmedMatch?.homeTeam ?? match.home;
  const away = confirmedMatch?.awayTeam ?? match.away;
  const dateUtc = confirmedMatch?.matchDateUtc ?? match.dateUtc;

  return (
    <article
      className={clsx(
        "overflow-hidden rounded-lg border text-white shadow-sm",
        finalMatch
          ? "border-limebet/60 bg-limebet/[0.09] shadow-glow"
          : bronzeMatch
            ? "border-amber-300/35 bg-amber-300/[0.06]"
            : "border-white/10 bg-felt"
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={clsx("text-[10px] font-black uppercase", finalMatch ? "text-limebet" : bronzeMatch ? "text-amber-200" : "text-steel")}>
            {finalMatch ? "Final" : bronzeMatch ? "3º lugar" : `Jogo ${match.number}`}
          </span>
          <span className="rounded-md bg-limebet px-1.5 py-0.5 text-[9px] font-black text-ink">{match.points} pts</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-steel">
          <Clock3 size={12} />
          {formatDateTimeBR(dateUtc)}
        </span>
      </div>

      <div className={clsx("divide-y divide-white/10", compact ? "text-xs" : "text-sm")}>
        <BracketSlot label={home} confirmed={Boolean(confirmedMatch)} />
        <BracketSlot label={away} confirmed={Boolean(confirmedMatch)} />
      </div>

      {!compact ? (
        <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2 text-[11px] font-semibold text-steel">
          <CalendarClock size={13} />
          {confirmedMatch ? (
            <>
              <span className={clsx("rounded-full border px-2 py-0.5", matchStateTone(confirmedMatch.computedState))}>
                {matchStateLabel(confirmedMatch.computedState)}
              </span>
              Confronto definido
            </>
          ) : (
            "Aguardando definição do confronto"
          )}
        </div>
      ) : null}
    </article>
  );
}

function BracketSlot({ label, confirmed }: { label: string; confirmed: boolean }) {
  const asset = confirmed ? getTeamAsset(label) : null;

  return (
    <div className="flex min-h-10 items-center gap-2 px-3 py-2">
      {asset ? (
        <TeamFlag asset={asset} label={label} size="sm" />
      ) : (
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/10 bg-ink text-[9px] font-black text-limebet">
          ?
        </div>
      )}
      <span className="min-w-0 truncate font-bold">{label}</span>
    </div>
  );
}

function desktopRoundSpacing(roundId: KnockoutRoundId) {
  if (roundId === "ROUND_OF_32") return "gap-3";
  if (roundId === "ROUND_OF_16") return "gap-[98px] pt-[53px]";
  if (roundId === "QUARTER_FINAL") return "gap-[310px] pt-[156px]";
  if (roundId === "SEMI_FINAL") return "gap-[735px] pt-[365px]";
  return "gap-6 pt-[610px]";
}

function knockoutMatchPoints(number: number) {
  if (number <= 96) return 2;
  if (number <= 100) return 4;
  if (number <= 103) return 5;
  return 8;
}

function ScoringTable() {
  const rows = [
    { label: "16 avos", points: 2, exact: 5 },
    { label: "Oitavas", points: 2, exact: 5 },
    { label: "Quartas", points: 4, exact: 7 },
    { label: "Semifinais", points: 5, exact: 8 },
    { label: "3º lugar", points: 5, exact: 8 },
    { label: "Final", points: 8, exact: 11 }
  ];

  return (
    <section className="rounded-lg border border-white/10 bg-felt p-4 text-white shadow-sm">
      <div className="mb-3">
        <p className="text-xs font-black uppercase text-limebet">Pontuação do mata-mata</p>
        <p className="mt-1 text-sm text-steel">O placar exato soma 3 pontos ao valor da fase.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-ink px-3 py-3">
            <span className="text-sm font-bold">{row.label}</span>
            <div className="text-right">
              <strong className="block text-sm text-limebet">{row.points} pts</strong>
              <span className="text-[10px] font-bold uppercase text-steel">exato: {row.exact}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
