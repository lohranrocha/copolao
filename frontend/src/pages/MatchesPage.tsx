import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Gift, ShieldCheck, Trophy } from "lucide-react";
import clsx from "clsx";
import { MatchCard } from "../components/MatchCard";
import { api, getApiError } from "../api/client";
import type { Match } from "../types/domain";
import { formatDateHeadingBR } from "../utils/date";

type ViewMode = "UPCOMING" | "GROUPS" | "KNOCKOUT" | "BONUS";

const tabs: Array<{ mode: ViewMode; label: string }> = [
  { mode: "UPCOMING", label: "Próximos" },
  { mode: "GROUPS", label: "Grupos" },
  { mode: "KNOCKOUT", label: "Mata-mata" },
  { mode: "BONUS", label: "Bônus" }
];

export function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [group, setGroup] = useState("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("UPCOMING");
  const [message, setMessage] = useState("");

  async function loadMatches() {
    const { data } = await api.get<{ matches: Match[] }>("/matches");
    setMatches(data.matches);
  }

  useEffect(() => {
    void loadMatches();
  }, []);

  const groups = useMemo(
    () => ["ALL", ...Array.from(new Set(matches.map((match) => match.groupCode).filter((value): value is string => Boolean(value))))],
    [matches]
  );
  const upcomingMatches = useMemo(
    () => matches.filter((match) => match.computedState === "OPEN" || match.computedState === "LOCKED"),
    [matches]
  );
  const groupMatches = group === "ALL" ? matches : matches.filter((match) => match.groupCode === group);
  const visibleMatches = viewMode === "GROUPS" ? groupMatches : upcomingMatches;
  const sections = viewMode === "GROUPS" ? groupSections(visibleMatches) : dateSections(visibleMatches);
  const firstMatchDate = matches[0]?.matchDateUtc;

  async function savePrediction(matchId: string, home: number, away: number) {
    setMessage("");
    try {
      await api.put(`/matches/${matchId}/prediction`, {
        homeScorePrediction: home,
        awayScorePrediction: away
      });
      await loadMatches();
      setMessage("Palpite salvo.");
    } catch (error) {
      setMessage(getApiError(error));
    }
  }

  return (
    <section>
      <div className="mb-5 overflow-hidden rounded-lg border border-limebet/20 bg-felt text-white shadow-glow">
        <div className="relative border-b border-white/10 px-4 py-5 md:px-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(33,247,102,0.22),transparent_34%),linear-gradient(135deg,rgba(33,247,102,0.12),transparent_45%)]" />
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-limebet/35 bg-limebet/10 px-3 py-1 text-xs font-bold uppercase text-limebet">
                <Trophy size={14} />
                Bolão privado
              </div>
              <h1 className="text-3xl font-black uppercase tracking-wide md:text-4xl">Jogos do Copolão</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-steel">
                Palpite rápido no celular, fechamento uma hora antes do jogo e tudo no horário do Brasil.
              </p>
            </div>
            <Countdown targetDate={firstMatchDate} />
          </div>
        </div>
        <div className="grid grid-cols-4">
          <div className="h-1 bg-limebet" />
          <div className="h-1 bg-mintbet" />
          <div className="h-1 bg-cyan-400" />
          <div className="h-1 bg-limebet" />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-4 rounded-lg border border-white/10 bg-felt p-1">
        {tabs.map((tab) => (
          <button
            key={tab.mode}
            className={clsx(
              "h-11 rounded-md text-xs font-bold transition md:text-sm",
              viewMode === tab.mode ? "bg-limebet text-ink shadow-glow" : "text-steel hover:bg-white/10 hover:text-white"
            )}
            type="button"
            onClick={() => setViewMode(tab.mode)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {viewMode === "GROUPS" ? (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {groups.map((item) => (
            <button
              key={item}
              className={clsx(
                "h-10 shrink-0 rounded-lg border px-4 text-sm font-bold transition",
                group === item ? "border-limebet bg-limebet text-ink" : "border-white/10 bg-felt text-steel"
              )}
              type="button"
              onClick={() => setGroup(item)}
            >
              {item === "ALL" ? "Todos" : `Grupo ${item}`}
            </button>
          ))}
        </div>
      ) : null}

      {message ? <p className="mb-4 rounded-lg border border-limebet/30 bg-limebet/10 px-3 py-2 text-sm font-semibold text-limebet">{message}</p> : null}

      {viewMode === "KNOCKOUT" ? <ComingSoonPanel kind="knockout" /> : null}
      {viewMode === "BONUS" ? <ComingSoonPanel kind="bonus" /> : null}

      {viewMode === "UPCOMING" || viewMode === "GROUPS" ? (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-white/75">{section.title}</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {section.matches.map((match) => (
                  <MatchCard key={match.id} match={match} onSavePrediction={savePrediction} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function dateSections(matches: Match[]) {
  const map = new Map<string, Match[]>();

  for (const match of matches) {
    const title = formatDateHeadingBR(match.matchDateUtc);
    map.set(title, [...(map.get(title) ?? []), match]);
  }

  return Array.from(map.entries()).map(([title, sectionMatches]) => ({
    title,
    matches: sectionMatches
  }));
}

function groupSections(matches: Match[]) {
  const map = new Map<string, Match[]>();

  for (const match of matches) {
    const title = match.groupCode ? `Grupo ${match.groupCode}` : "Sem grupo";
    map.set(title, [...(map.get(title) ?? []), match]);
  }

  return Array.from(map.entries()).map(([title, sectionMatches]) => ({
    title,
    matches: sectionMatches
  }));
}

function Countdown({ targetDate }: { targetDate?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!targetDate) {
    return null;
  }

  const remaining = Math.max(new Date(targetDate).getTime() - now.getTime(), 0);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);

  return (
    <div className="relative rounded-lg border border-limebet/25 bg-black/35 p-3">
      <p className="mb-2 text-xs font-bold uppercase text-steel">Faltam para a Copa</p>
      <div className="grid grid-cols-3 gap-2">
        <CountdownUnit label="dias" value={days} />
        <CountdownUnit label="horas" value={hours} />
        <CountdownUnit label="min" value={minutes} />
      </div>
    </div>
  );
}

function CountdownUnit({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-16 rounded-lg border border-limebet/25 bg-ink px-3 py-2 text-center">
      <p className="text-2xl font-black leading-none text-limebet">{String(value).padStart(2, "0")}</p>
      <p className="mt-1 text-[10px] font-bold uppercase text-steel">{label}</p>
    </div>
  );
}

function ComingSoonPanel({ kind }: { kind: "knockout" | "bonus" }) {
  const isBonus = kind === "bonus";
  const Icon = isBonus ? Gift : ShieldCheck;

  return (
    <div className="rounded-lg border border-white/10 bg-felt p-5 text-white shadow-sm">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-limebet text-ink">
        <Icon size={24} />
      </div>
      <h2 className="text-xl font-black">{isBonus ? "Palpites bônus" : "Mata-mata"}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
        {isBonus
          ? "Próxima evolução: campeão, artilheiro, melhor ataque, melhor defesa e perguntas especiais do bolão."
          : "Os jogos eliminatórios entram quando os confrontos forem definidos. A tela já está reservada para essa fase."}
      </p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-limebet/10 px-3 py-1 text-xs font-bold uppercase text-limebet">
        <CalendarClock size={14} />
        Em breve
      </div>
    </div>
  );
}
