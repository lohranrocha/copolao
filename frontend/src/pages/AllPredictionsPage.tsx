import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, Lock, RefreshCw, UsersRound } from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "../components/PageHeader";
import { TeamFlag } from "../components/TeamFlag";
import { UserAvatar } from "../components/UserAvatar";
import { useAuth } from "../api/auth";
import { api, getApiError } from "../api/client";
import type { PredictionBoardMatch, PredictionBoardParticipant } from "../types/domain";
import { formatDateTimeBR } from "../utils/date";
import { getTeamAsset } from "../utils/teamAssets";
import { matchCompetitionLabel, matchStateLabel, matchStateTone } from "../utils/match";

type BoardResponse = {
  participants: PredictionBoardParticipant[];
  matches: PredictionBoardMatch[];
};

export function AllPredictionsPage() {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<PredictionBoardParticipant[]>([]);
  const [matches, setMatches] = useState<PredictionBoardMatch[]>([]);
  const [group, setGroup] = useState("ALL");
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadBoard(showRefreshState = false) {
    if (showRefreshState) setRefreshing(true);

    try {
      const { data } = await api.get<BoardResponse>("/predictions/board", {
        params: { updatedAt: Date.now() }
      });
      setParticipants(data.participants);
      setMatches(data.matches);
      setError("");
    } catch (loadError) {
      setError(getApiError(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadBoard();

    const refresh = () => void loadBoard();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const interval = window.setInterval(refreshWhenVisible, 15_000);

    window.addEventListener("focus", refresh);
    window.addEventListener("copolao:prediction-updated", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("copolao:prediction-updated", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const groups = useMemo(
    () => ["ALL", ...Array.from(new Set(matches.map((match) => match.groupCode).filter((value): value is string => Boolean(value))))],
    [matches]
  );
  const visibleMatches = group === "ALL" ? matches : matches.filter((match) => match.groupCode === group);
  const sections = useMemo(() => buildMatchSections(visibleMatches), [visibleMatches]);

  function toggleMatch(matchId: string) {
    setExpandedMatches((current) => {
      const next = new Set(current);
      if (next.has(matchId)) {
        next.delete(matchId);
      } else {
        next.add(matchId);
      }
      return next;
    });
  }

  return (
    <section>
      <PageHeader
        title="Todos os palpites"
        description="Antes do jogo começar, os palpites dos outros participantes ficam ocultos. Depois do início, todo mundo vê."
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
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
        <button
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-felt text-steel transition hover:border-limebet/45 hover:text-limebet disabled:opacity-50"
          disabled={refreshing}
          title="Atualizar palpites"
          type="button"
          onClick={() => void loadBoard(true)}
        >
          <RefreshCw className={refreshing ? "animate-spin" : ""} size={17} />
        </button>
      </div>

      {error ? <p className="mb-4 rounded-lg border border-rose-300/25 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200">{error}</p> : null}

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-white/75">{section.title}</h2>
            <div className="space-y-4">
              {section.matches.map((match) => (
                <PredictionBoardCard
                  key={match.id}
                  match={match}
                  participants={participants}
                  currentUserId={user?.id ?? null}
                  expanded={expandedMatches.has(match.id)}
                  onToggle={() => toggleMatch(match.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {!loading && visibleMatches.length === 0 ? <p className="rounded-lg border border-white/10 bg-felt p-4 text-sm text-steel">Nenhum jogo encontrado para este filtro.</p> : null}
    </section>
  );
}

function PredictionBoardCard({
  match,
  participants,
  currentUserId,
  expanded,
  onToggle
}: {
  match: PredictionBoardMatch;
  participants: PredictionBoardParticipant[];
  currentUserId: string | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  const homeAsset = getTeamAsset(match.homeTeam);
  const awayAsset = getTeamAsset(match.awayTeam);
  const predictionsByUser = new Map(match.predictions.map((prediction) => [prediction.userId, prediction]));
  const boardParticipants = mergeBoardParticipants(participants, match.predictions);
  const ownParticipant = boardParticipants.find((participant) => participant.id === currentUserId);
  const visibleParticipants = expanded ? boardParticipants : ownParticipant ? [ownParticipant] : [];
  const hiddenParticipantsCount = Math.max(boardParticipants.length - visibleParticipants.length, 0);

  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-felt text-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase text-steel">
            {matchCompetitionLabel(match.stage, match.groupCode)} · {formatDateTimeBR(match.matchDateUtc)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-base font-black">
            <span className="inline-flex items-center gap-2">
              <TeamFlag asset={homeAsset} label={match.homeTeam} size="sm" />
              {match.homeTeam}
            </span>
            <span className="text-limebet">x</span>
            <span className="inline-flex items-center gap-2">
              <TeamFlag asset={awayAsset} label={match.awayTeam} size="sm" />
              {match.awayTeam}
            </span>
          </div>
        </div>
        <span className={clsx("shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold", matchStateTone(match.computedState))}>
          {matchStateLabel(match.computedState)}
        </span>
      </div>

      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-steel">
          {match.viewerCanSeePredictions ? <Eye size={15} className="text-limebet" /> : <EyeOff size={15} className="text-amber-300" />}
          {visibilityLabel(match)}
        </div>
        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 bg-ink px-3 text-xs font-black text-white transition hover:border-limebet/45 hover:bg-limebet/10"
          type="button"
          onClick={onToggle}
        >
          <UsersRound size={15} />
          {expanded ? "Ocultar outros" : `Mostrar todos${hiddenParticipantsCount ? ` (${hiddenParticipantsCount})` : ""}`}
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      <div className="divide-y divide-white/10">
        {visibleParticipants.map((participant) => {
          const isOwnParticipant = participant.id === currentUserId;
          const shouldMaskParticipant = !match.isPublic && !isOwnParticipant;
          const prediction = predictionsByUser.get(participant.id);
          return (
            <div key={participant.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar avatarUrl={participant.avatarUrl} name={participant.nickname || participant.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{participant.nickname || participant.name}</p>
                  <p className="text-xs text-steel">{shouldMaskParticipant ? "Oculto até o início" : prediction ? predictionLabel(prediction.hidden) : "Sem palpite"}</p>
                </div>
              </div>
              <PredictionValue masked={shouldMaskParticipant} prediction={prediction} />
            </div>
          );
        })}
      </div>

      {!expanded && hiddenParticipantsCount > 0 ? (
        <div className="border-t border-white/10 bg-white/[0.02] px-4 py-3 text-xs font-semibold text-steel">
          {hiddenParticipantsCount} participante(s) oculto(s) nesta partida. Toque em “Mostrar todos” para abrir a lista.
        </div>
      ) : null}

      {boardParticipants.length === 0 ? <p className="px-4 py-4 text-sm text-steel">Nenhum participante cadastrado ainda.</p> : null}
    </article>
  );
}

function PredictionValue({
  prediction,
  masked
}: {
  prediction: PredictionBoardMatch["predictions"][number] | undefined;
  masked: boolean;
}) {
  if (masked) {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm font-bold text-amber-200">
        <Lock size={14} />
        oculto
      </span>
    );
  }

  if (!prediction) {
    return <span className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-steel">--</span>;
  }

  if (prediction.hidden) {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm font-bold text-amber-200">
        <Lock size={14} />
        oculto
      </span>
    );
  }

  return (
    <span className="rounded-lg border border-limebet/25 bg-limebet/10 px-3 py-2 text-sm font-black text-limebet">
      {prediction.homeScorePrediction} x {prediction.awayScorePrediction}
    </span>
  );
}

function visibilityLabel(match: PredictionBoardMatch) {
  if (match.isPublic) return "Palpites liberados para todos.";
  return "Palpites dos outros ficam ocultos até o início.";
}

function predictionLabel(hidden: boolean) {
  return hidden ? "Enviado, mas ainda bloqueado" : "Palpite enviado";
}

function mergeBoardParticipants(
  participants: PredictionBoardParticipant[],
  predictions: PredictionBoardMatch["predictions"]
) {
  const participantsById = new Map(participants.map((participant) => [participant.id, participant]));

  for (const prediction of predictions) {
    participantsById.set(prediction.userId, prediction.user);
  }

  return Array.from(participantsById.values()).sort((a, b) =>
    (a.nickname || a.name).localeCompare(b.nickname || b.name, "pt-BR")
  );
}

function buildMatchSections(matches: PredictionBoardMatch[]) {
  const sortedMatches = [...matches].sort(compareMatchesByDayPriority);
  const todayMatches = sortedMatches.filter((match) => isTodayInBrazil(match.matchDateUtc));
  const otherMatches = sortedMatches.filter((match) => !isTodayInBrazil(match.matchDateUtc));

  if (todayMatches.length === 0) {
    return [{ title: "Jogos", matches: sortedMatches }];
  }

  return [
    { title: "Jogos de hoje", matches: todayMatches },
    ...(otherMatches.length > 0 ? [{ title: "Outros jogos", matches: otherMatches }] : [])
  ];
}

function compareMatchesByDayPriority(a: PredictionBoardMatch, b: PredictionBoardMatch) {
  const aIsToday = isTodayInBrazil(a.matchDateUtc);
  const bIsToday = isTodayInBrazil(b.matchDateUtc);

  if (aIsToday !== bIsToday) return aIsToday ? -1 : 1;

  return new Date(a.matchDateUtc).getTime() - new Date(b.matchDateUtc).getTime() || a.matchNumber - b.matchNumber;
}

function isTodayInBrazil(date: string) {
  return getBrazilDateKey(date) === getBrazilDateKey(new Date());
}

function getBrazilDateKey(date: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(date));
}
