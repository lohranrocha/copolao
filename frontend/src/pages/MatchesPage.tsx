import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Gift, GripVertical, Save, Trophy, X } from "lucide-react";
import clsx from "clsx";
import { KnockoutPreview } from "../components/KnockoutPreview";
import { MatchCard } from "../components/MatchCard";
import { TeamFlag } from "../components/TeamFlag";
import { api, getApiError } from "../api/client";
import type { BonusQuestion, GroupStandingBonus, Match } from "../types/domain";
import { formatDateHeadingBR, formatDateTimeBR } from "../utils/date";
import { getTeamAsset } from "../utils/teamAssets";

type ViewMode = "UPCOMING" | "GROUPS" | "KNOCKOUT" | "BONUS";

const tabs: Array<{ mode: ViewMode; label: string }> = [
  { mode: "UPCOMING", label: "Próximos" },
  { mode: "GROUPS", label: "Grupos" },
  { mode: "KNOCKOUT", label: "Mata-mata" },
  { mode: "BONUS", label: "Bônus" }
];

export function MatchesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [matches, setMatches] = useState<Match[]>([]);
  const [group, setGroup] = useState("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>(() => viewModeFromParam(searchParams.get("aba")));
  const [message, setMessage] = useState("");

  async function loadMatches() {
    const { data } = await api.get<{ matches: Match[] }>("/matches");
    setMatches(data.matches);
  }

  useEffect(() => {
    void loadMatches();
  }, []);

  useEffect(() => {
    setViewMode(viewModeFromParam(searchParams.get("aba")));
  }, [searchParams]);

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
      window.dispatchEvent(new Event("copolao:prediction-updated"));
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
            onClick={() => {
              setViewMode(tab.mode);
              setSearchParams(tab.mode === "UPCOMING" ? {} : { aba: tabParam(tab.mode) });
            }}
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

      {viewMode === "KNOCKOUT" ? <KnockoutPreview /> : null}
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

function viewModeFromParam(value: string | null): ViewMode {
  if (value === "grupos") return "GROUPS";
  if (value === "mata-mata") return "KNOCKOUT";
  if (value === "bonus") return "BONUS";
  return "UPCOMING";
}

function tabParam(mode: ViewMode) {
  if (mode === "GROUPS") return "grupos";
  if (mode === "KNOCKOUT") return "mata-mata";
  if (mode === "BONUS") return "bonus";
  return "proximos";
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

function BonusPredictionsPanel() {
  const [questions, setQuestions] = useState<BonusQuestion[]>([]);
  const [groupStandings, setGroupStandings] = useState<GroupStandingBonus[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [standingAnswers, setStandingAnswers] = useState<Record<string, StandingDraft>>({});
  const [activeStandingGroup, setActiveStandingGroup] = useState("");
  const [message, setMessage] = useState("");
  const [savedBonusQuestionId, setSavedBonusQuestionId] = useState("");
  const [savedGroupStandings, setSavedGroupStandings] = useState(false);

  async function loadBonus() {
    const { data } = await api.get<{ questions: BonusQuestion[]; groupStandings: GroupStandingBonus[] }>("/bonus");
    setQuestions(data.questions);
    setGroupStandings(data.groupStandings);
    setActiveStandingGroup((current) =>
      current && data.groupStandings.some((group) => group.groupCode === current)
        ? current
        : data.groupStandings[0]?.groupCode ?? ""
    );
    setAnswers(Object.fromEntries(data.questions.map((question) => [question.id, question.myPrediction?.answer ?? ""])));
    setStandingAnswers(
      Object.fromEntries(
        data.groupStandings.map((group) => [
          group.groupCode,
          group.myPrediction
            ? {
                firstTeam: group.myPrediction.firstTeam,
                secondTeam: group.myPrediction.secondTeam,
                thirdTeam: group.myPrediction.thirdTeam,
                fourthTeam: group.myPrediction.fourthTeam
              }
            : blankStanding(group.teams)
        ])
      )
    );
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
      setSavedBonusQuestionId(questionId);
      window.setTimeout(() => setSavedBonusQuestionId((current) => (current === questionId ? "" : current)), 2600);
      setMessage("");
    } catch (error) {
      setMessage(getApiError(error));
    }
  }

  async function saveAllGroupStandings() {
    setMessage("");

    try {
      await api.put("/bonus/groups/predictions", {
        groups: groupStandings.map((group) => ({
          groupCode: group.groupCode,
          ...standingAnswers[group.groupCode]
        }))
      });
      await loadBonus();
      setSavedGroupStandings(true);
      window.setTimeout(() => setSavedGroupStandings(false), 3200);
      setMessage("");
    } catch (error) {
      setMessage(getApiError(error));
    }
  }

  function setStanding(groupCode: string, draft: StandingDraft) {
    setStandingAnswers((current) => ({
      ...current,
      [groupCode]: draft
    }));
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

      <GroupStandingPanel
        groups={groupStandings}
        values={standingAnswers}
        activeGroupCode={activeStandingGroup}
        onActiveGroupChange={setActiveStandingGroup}
        onSetStanding={setStanding}
        onSaveAll={saveAllGroupStandings}
        saved={savedGroupStandings}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {questions.map((question) => {
          const locked = question.computedState !== "OPEN";
          const hasPrediction = Boolean(question.myPrediction);
          const savedNow = savedBonusQuestionId === question.id;
          return (
            <article
              key={question.id}
              className={clsx(
                "rounded-lg border p-4 text-white shadow-sm transition",
                savedNow
                  ? "border-limebet/60 bg-limebet/[0.09] shadow-glow"
                  : hasPrediction
                    ? "border-limebet/30 bg-[linear-gradient(145deg,rgba(33,247,102,0.08),rgba(18,19,24,1)_38%)]"
                    : "border-white/10 bg-felt"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-limebet">{question.points} pts</p>
                  <h3 className="mt-1 text-lg font-black">{question.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-steel">{question.description}</p>
                </div>
                <span className={clsx("shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold", locked ? "border-amber-300/25 bg-amber-300/10 text-amber-200" : "border-limebet/25 bg-limebet/10 text-limebet")}>
                  {savedNow ? "Salvo agora" : hasPrediction ? "Palpite feito" : bonusStateLabel(question.computedState)}
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
                {savedNow ? <CheckCircle2 size={18} /> : <Save size={18} />}
                {savedNow ? "Palpite salvo" : question.myPrediction ? "Atualizar bônus" : "Salvar bônus"}
              </button>

              {savedNow ? (
                <p className="mt-3 rounded-lg border border-limebet/35 bg-limebet/10 px-3 py-2 text-sm font-bold text-limebet">
                  Seu palpite foi salvo com sucesso.
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      {questions.length === 0 ? <p className="rounded-lg border border-white/10 bg-felt p-4 text-sm text-steel">Nenhuma pergunta bônus ativa.</p> : null}
    </div>
  );
}

type StandingDraft = {
  firstTeam: string;
  secondTeam: string;
  thirdTeam: string;
  fourthTeam: string;
};

const emptyStanding: StandingDraft = {
  firstTeam: "",
  secondTeam: "",
  thirdTeam: "",
  fourthTeam: ""
};

const standingFields: Array<{ key: keyof StandingDraft; label: string }> = [
  { key: "firstTeam", label: "1º lugar" },
  { key: "secondTeam", label: "2º lugar" },
  { key: "thirdTeam", label: "3º lugar" },
  { key: "fourthTeam", label: "4º lugar" }
];

function blankStanding(_teams: string[]): StandingDraft {
  return { ...emptyStanding };
}

function GroupStandingPanel({
  groups,
  values,
  activeGroupCode,
  onActiveGroupChange,
  onSetStanding,
  onSaveAll,
  saved
}: {
  groups: GroupStandingBonus[];
  values: Record<string, StandingDraft>;
  activeGroupCode: string;
  onActiveGroupChange: (groupCode: string) => void;
  onSetStanding: (groupCode: string, draft: StandingDraft) => void;
  onSaveAll: () => void;
  saved: boolean;
}) {
  const activeGroup = groups.find((group) => group.groupCode === activeGroupCode) ?? groups[0];
  const [draggedTeam, setDraggedTeam] = useState("");

  if (!activeGroup) {
    return null;
  }

  const value = values[activeGroup.groupCode] ?? blankStanding(activeGroup.teams);
  const locked = activeGroup.computedState !== "OPEN";
  const selectedTeams = standingToList(value);
  const availableTeams = activeGroup.teams.filter((team) => !selectedTeams.includes(team));
  const completedGroups = groups.filter((group) => isStandingComplete(values[group.groupCode])).length;
  const allComplete = groups.length > 0 && completedGroups === groups.length;
  const hasLockedGroup = groups.some((group) => group.computedState !== "OPEN");

  function applyOrder(teams: string[]) {
    onSetStanding(activeGroup.groupCode, listToStanding(teams));
  }

  function placeTeam(team: string, index: number) {
    if (locked || !team) return;
    const next = selectedTeams.filter((selectedTeam) => selectedTeam !== team);
    next.splice(index, 0, team);
    applyOrder(next.slice(0, 4));
  }

  function removeTeam(team: string) {
    if (locked) return;
    applyOrder(selectedTeams.filter((selectedTeam) => selectedTeam !== team));
  }

  function moveTeam(index: number, delta: number) {
    if (locked) return;
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= selectedTeams.length) return;
    const next = [...selectedTeams];
    const [team] = next.splice(index, 1);
    next.splice(targetIndex, 0, team);
    applyOrder(next);
  }

  return (
    <section className="rounded-lg border border-white/10 bg-felt p-4 text-white shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-black">Classificação dos grupos</h3>
          <p className="mt-1 text-sm leading-6 text-steel">
            Escolha um grupo por vez. Suas escolhas ficam guardadas enquanto você troca de grupo, e o envio final salva todos de uma vez.
          </p>
          <p className="mt-2 text-xs font-bold uppercase text-limebet">
            {completedGroups}/{groups.length} grupos completos
          </p>
        </div>
        <button
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-limebet px-4 text-sm font-black text-ink disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!allComplete || hasLockedGroup}
          type="button"
          onClick={onSaveAll}
        >
          <Save size={18} />
          Salvar todos os grupos
        </button>
      </div>

      {saved ? (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-limebet/35 bg-limebet/10 px-3 py-3 text-sm font-bold text-limebet">
          <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
          Classificação dos grupos salva com sucesso.
        </div>
      ) : null}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {groups.map((group) => {
          const isActive = group.groupCode === activeGroup.groupCode;
          const isComplete = isStandingComplete(values[group.groupCode]);
          return (
            <button
              key={group.groupCode}
              className={clsx(
                "h-10 shrink-0 rounded-lg border px-4 text-sm font-black transition",
                isActive
                  ? "border-limebet bg-limebet text-ink shadow-glow"
                  : isComplete
                    ? "border-limebet/30 bg-limebet/10 text-limebet"
                    : "border-white/10 bg-ink text-steel hover:border-limebet/35 hover:text-white"
              )}
              type="button"
              onClick={() => onActiveGroupChange(group.groupCode)}
            >
              Grupo {group.groupCode}
            </button>
          );
        })}
      </div>

      <article className={clsx("mt-4 rounded-lg border p-4", isStandingComplete(value) ? "border-limebet/35 bg-limebet/[0.06]" : "border-white/10 bg-ink")}>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-limebet">Grupo {activeGroup.groupCode}</p>
            <h4 className="mt-1 text-lg font-black">Ordem final do grupo</h4>
            <p className="mt-1 text-xs text-steel">Fecha em {formatDateTimeBR(activeGroup.lockAtUtc)}</p>
          </div>
          <span className={clsx("w-fit rounded-full border px-2.5 py-1 text-xs font-semibold", locked ? "border-amber-300/25 bg-amber-300/10 text-amber-200" : activeGroup.myPrediction ? "border-limebet/35 bg-limebet/10 text-limebet" : "border-white/10 bg-white/5 text-steel")}>
            {activeGroup.myPrediction ? "Palpite feito" : bonusStateLabel(activeGroup.computedState)}
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="space-y-2">
            {standingFields.map((field, index) => {
              const team = selectedTeams[index] ?? "";
              const asset = team ? getTeamAsset(team) : null;
              return (
                <div
                  key={field.key}
                  className={clsx(
                    "grid min-h-[68px] grid-cols-[64px_1fr] items-center gap-3 rounded-lg border px-3 py-2 transition",
                    team ? "border-limebet/30 bg-limebet/[0.06]" : "border-dashed border-white/15 bg-ink"
                  )}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    placeTeam(draggedTeam, index);
                    setDraggedTeam("");
                  }}
                >
                  <span className="text-sm font-black text-limebet">{field.label}</span>
                  {team && asset ? (
                    <div
                      className="flex min-w-0 items-center gap-3 rounded-lg bg-ink px-2 py-2"
                      draggable={!locked}
                      onDragStart={() => setDraggedTeam(team)}
                    >
                      <GripVertical className="shrink-0 text-steel" size={17} />
                      <TeamFlag asset={asset} label={team} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm font-bold">{team}</span>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-xs font-black text-steel disabled:opacity-30"
                          disabled={locked || index === 0}
                          type="button"
                          onClick={() => moveTeam(index, -1)}
                        >
                          ↑
                        </button>
                        <button
                          className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-xs font-black text-steel disabled:opacity-30"
                          disabled={locked || index === selectedTeams.length - 1}
                          type="button"
                          onClick={() => moveTeam(index, 1)}
                        >
                          ↓
                        </button>
                        <button
                          aria-label={`Remover ${team}`}
                          className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-steel disabled:opacity-30"
                          disabled={locked}
                          type="button"
                          onClick={() => removeTeam(team)}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm font-semibold text-steel">
                      Arraste uma seleção para esta posição
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-white/10 bg-ink p-3">
            <p className="mb-3 text-xs font-black uppercase text-steel">Seleções disponíveis</p>
            <div className="space-y-2">
              {availableTeams.map((team) => {
                const asset = getTeamAsset(team);
                return (
                  <button
                    key={team}
                    className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-felt px-2 py-2 text-left transition hover:border-limebet/40 disabled:opacity-60"
                    draggable={!locked}
                    disabled={locked}
                    type="button"
                    onClick={() => placeTeam(team, selectedTeams.length)}
                    onDragStart={() => setDraggedTeam(team)}
                  >
                    <TeamFlag asset={asset} label={team} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-white">{team}</span>
                    <span className="shrink-0 rounded-md bg-limebet px-2 py-1 text-[11px] font-black text-ink">Adicionar</span>
                  </button>
                );
              })}
              {availableTeams.length === 0 ? (
                <p className="rounded-lg bg-black/20 px-3 py-3 text-sm font-semibold text-limebet">Grupo completo.</p>
              ) : null}
            </div>
          </div>
        </div>

        {activeGroup.result ? (
          <div className="mt-3 rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm">
            <span className="text-steel">Pontuação: </span>
            <strong className="text-limebet">{activeGroup.myPrediction?.points ?? 0} pts</strong>
            <span className="ml-2 text-xs text-steel">({activeGroup.myPrediction?.correctPositions ?? 0}/4)</span>
          </div>
        ) : null}
      </article>

      {!allComplete ? (
        <p className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100">
          Complete todos os grupos para liberar o salvamento único.
        </p>
      ) : null}
    </section>
  );
}

function isStandingComplete(value?: StandingDraft) {
  if (!value) return false;
  const selectedTeams = new Set(Object.values(value).filter(Boolean));
  return Object.values(value).every(Boolean) && selectedTeams.size === 4;
}

function standingToList(value?: StandingDraft) {
  if (!value) return [];
  return [value.firstTeam, value.secondTeam, value.thirdTeam, value.fourthTeam].filter(Boolean);
}

function listToStanding(teams: string[]): StandingDraft {
  return {
    firstTeam: teams[0] ?? "",
    secondTeam: teams[1] ?? "",
    thirdTeam: teams[2] ?? "",
    fourthTeam: teams[3] ?? ""
  };
}

function bonusStateLabel(state: BonusQuestion["computedState"]) {
  if (state === "SETTLED") return "Apurado";
  if (state === "LOCKED") return "Fechado";
  return "Aberto";
}
