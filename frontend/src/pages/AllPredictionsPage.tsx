import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "../components/PageHeader";
import { api } from "../api/client";
import type { PredictionBoardMatch, PredictionBoardParticipant } from "../types/domain";
import { formatDateTimeBR } from "../utils/date";
import { getTeamAsset } from "../utils/teamAssets";
import { matchStateLabel, matchStateTone } from "../utils/match";

type BoardResponse = {
  participants: PredictionBoardParticipant[];
  matches: PredictionBoardMatch[];
};

export function AllPredictionsPage() {
  const [participants, setParticipants] = useState<PredictionBoardParticipant[]>([]);
  const [matches, setMatches] = useState<PredictionBoardMatch[]>([]);
  const [group, setGroup] = useState("ALL");

  useEffect(() => {
    void api.get<BoardResponse>("/predictions/board").then(({ data }) => {
      setParticipants(data.participants);
      setMatches(data.matches);
    });
  }, []);

  const groups = useMemo(
    () => ["ALL", ...Array.from(new Set(matches.map((match) => match.groupCode).filter((value): value is string => Boolean(value))))],
    [matches]
  );
  const visibleMatches = group === "ALL" ? matches : matches.filter((match) => match.groupCode === group);

  return (
    <section>
      <PageHeader
        title="Todos os palpites"
        description="Antes do jogo começar, os palpites dos outros participantes ficam ocultos. Depois do início, todo mundo vê."
      />

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

      <div className="space-y-4">
        {visibleMatches.map((match) => (
          <PredictionBoardCard key={match.id} match={match} participants={participants} />
        ))}
      </div>

      {visibleMatches.length === 0 ? <p className="rounded-lg border border-white/10 bg-felt p-4 text-sm text-steel">Nenhum jogo encontrado para este filtro.</p> : null}
    </section>
  );
}

function PredictionBoardCard({
  match,
  participants
}: {
  match: PredictionBoardMatch;
  participants: PredictionBoardParticipant[];
}) {
  const homeAsset = getTeamAsset(match.homeTeam);
  const awayAsset = getTeamAsset(match.awayTeam);
  const predictionsByUser = new Map(match.predictions.map((prediction) => [prediction.userId, prediction]));

  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-felt text-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase text-steel">
            Grupo {match.groupCode} · {formatDateTimeBR(match.matchDateUtc)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-base font-black">
            <span>{homeAsset.flag} {match.homeTeam}</span>
            <span className="text-limebet">x</span>
            <span>{awayAsset.flag} {match.awayTeam}</span>
          </div>
        </div>
        <span className={clsx("shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold", matchStateTone(match.computedState))}>
          {matchStateLabel(match.computedState)}
        </span>
      </div>

      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-xs font-semibold text-steel">
        {match.viewerCanSeePredictions ? <Eye size={15} className="text-limebet" /> : <EyeOff size={15} className="text-amber-300" />}
        {visibilityLabel(match)}
      </div>

      <div className="divide-y divide-white/10">
        {participants.map((participant) => {
          const prediction = predictionsByUser.get(participant.id);
          return (
            <div key={participant.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{participant.nickname || participant.name}</p>
                <p className="text-xs text-steel">{prediction ? predictionLabel(prediction.hidden) : "Sem palpite"}</p>
              </div>
              <PredictionValue prediction={prediction} />
            </div>
          );
        })}
      </div>

      {participants.length === 0 ? <p className="px-4 py-4 text-sm text-steel">Nenhum participante cadastrado ainda.</p> : null}
    </article>
  );
}

function PredictionValue({ prediction }: { prediction: PredictionBoardMatch["predictions"][number] | undefined }) {
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
  if (match.viewerCanSeePredictions) return "Visível para admin. Participantes só veem os próprios palpites antes do início.";
  return "Palpites dos outros ficam ocultos até o início.";
}

function predictionLabel(hidden: boolean) {
  return hidden ? "Enviado, mas ainda bloqueado" : "Palpite enviado";
}
