import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Gift, Save, ShieldCheck, Trophy } from "lucide-react";
import clsx from "clsx";
import { MatchCard } from "../components/MatchCard";
import { api, getApiError } from "../api/client";
import type { BonusQuestion, Match } from "../types/domain";
import { formatDateHeadingBR, formatDateTimeBR } from "../utils/date";

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
                Palpite rápido no celular, fechamento 30 minutos antes do jogo e tudo no horário do Brasil.
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

      {viewMode === "KNOCKOUT" ? <ComingSoonPanel /> : null}
      {viewMode === "BONUS" ? <BonusPredictionsPanel /> : null}

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

function ComingSoonPanel() {
  return (
    <div className="rounded-lg border border-white/10 bg-felt p-5 text-white shadow-sm">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-limebet text-ink">
        <ShieldCheck size={24} />
      </div>
      <h2 className="text-xl font-black">Mata-mata</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
        Os jogos eliminatórios entram quando os confrontos forem definidos. A tela já está reservada para essa fase.
      </p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-limebet/10 px-3 py-1 text-xs font-bold uppercase text-limebet">
        <CalendarClock size={14} />
        Em breve
      </div>
    </div>
  );
}

function BonusPredictionsPanel() {
  const [questions, setQuestions] = useState<BonusQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function loadBonus() {
    const { data } = await api.get<{ questions: BonusQuestion[] }>("/bonus");
    setQuestions(data.questions);
    setAnswers(Object.fromEntries(data.questions.map((question) => [question.id, question.myPrediction?.answer ?? ""])));
  }

  useEffect(() => {
    void loadBonus();
  }, []);

  async function saveBonus(questionId: string) {
    setMessage("");

    try {
      await api.put(`/bonus/${questionId}/prediction`, {
        answer: answers[questionId] ?? ""
      });
      await loadBonus();
      setMessage("Palpite bônus salvo.");
    } catch (error) {
      setMessage(getApiError(error));
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-felt p-5 text-white shadow-sm">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-limebet text-ink">
          <Gift size={24} />
        </div>
        <h2 className="text-xl font-black">Palpites bônus</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
          Responda antes do fechamento. Quando o admin lançar a resposta correta, os pontos entram no ranking.
        </p>
      </div>

      {message ? <p className="rounded-lg border border-limebet/30 bg-limebet/10 px-3 py-2 text-sm font-semibold text-limebet">{message}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {questions.map((question) => {
          const locked = question.computedState !== "OPEN";
          return (
            <article key={question.id} className="rounded-lg border border-white/10 bg-felt p-4 text-white shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-limebet">{question.points} pts</p>
                  <h3 className="mt-1 text-lg font-black">{question.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-steel">{question.description}</p>
                </div>
                <span className={clsx("shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold", locked ? "border-amber-300/25 bg-amber-300/10 text-amber-200" : "border-limebet/25 bg-limebet/10 text-limebet")}>
                  {bonusStateLabel(question.computedState)}
                </span>
              </div>

              <p className="mt-3 text-xs text-steel">Fecha em {formatDateTimeBR(question.lockAtUtc)}</p>

              <label className="mt-4 block">
                <span className="text-sm font-medium text-white/80">Seu palpite</span>
                <input
                  className="mt-1 h-12 w-full rounded-lg border border-white/10 bg-ink px-3 text-white outline-none focus:border-limebet disabled:opacity-70"
                  disabled={locked}
                  value={answers[question.id] ?? ""}
                  onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                />
              </label>

              {question.correctAnswer ? (
                <div className="mt-3 rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm">
                  <span className="text-steel">Resposta correta: </span>
                  <strong>{question.correctAnswer}</strong>
                  <strong className="float-right text-limebet">{question.myPrediction?.points ?? 0} pts</strong>
                </div>
              ) : null}

              <button
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-limebet font-black text-ink disabled:cursor-not-allowed disabled:opacity-50"
                disabled={locked}
                type="button"
                onClick={() => saveBonus(question.id)}
              >
                <Save size={18} />
                Salvar bônus
              </button>
            </article>
          );
        })}
      </div>

      {questions.length === 0 ? <p className="rounded-lg border border-white/10 bg-felt p-4 text-sm text-steel">Nenhuma pergunta bônus ativa.</p> : null}
    </div>
  );
}

function bonusStateLabel(state: BonusQuestion["computedState"]) {
  if (state === "SETTLED") return "Apurado";
  if (state === "LOCKED") return "Fechado";
  return "Aberto";
}
