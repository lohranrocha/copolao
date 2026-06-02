import { useState } from "react";
import clsx from "clsx";
import type { Match } from "../types/domain";
import { formatDateTimeBR } from "../utils/date";
import { matchStateLabel, matchStateTone } from "../utils/match";

export function MatchCard({
  match,
  onSavePrediction
}: {
  match: Match;
  onSavePrediction: (matchId: string, home: number, away: number) => Promise<void>;
}) {
  const [home, setHome] = useState(match.myPrediction?.homeScorePrediction ?? 0);
  const [away, setAway] = useState(match.myPrediction?.awayScorePrediction ?? 0);
  const [saving, setSaving] = useState(false);
  const canEdit = match.computedState === "OPEN";

  async function submit() {
    setSaving(true);
    try {
      await onSavePrediction(match.id, home, away);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">
            Grupo {match.groupCode} · {formatDateTimeBR(match.matchDateUtc)}
          </p>
          <h2 className="mt-2 text-lg font-bold leading-6 text-night">
            {match.homeTeam} <span className="text-slate-400">x</span> {match.awayTeam}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {match.venue}, {match.city}
          </p>
        </div>
        <span className={clsx("shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold", matchStateTone(match.computedState))}>
          {matchStateLabel(match.computedState)}
        </span>
      </div>

      {match.homeScore !== null && match.awayScore !== null ? (
        <div className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold">
          Resultado: {match.homeTeam} {match.homeScore} x {match.awayScore} {match.awayTeam}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <ScoreInput label={match.homeTeam} value={home} disabled={!canEdit} onChange={setHome} />
        <span className="pb-3 text-sm font-semibold text-slate-400">x</span>
        <ScoreInput label={match.awayTeam} value={away} disabled={!canEdit} onChange={setAway} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {match.myPrediction ? `${match.myPrediction.points} ponto(s) neste jogo` : "Sem palpite enviado"}
        </p>
        <button
          type="button"
          disabled={!canEdit || saving}
          onClick={submit}
          className="h-10 rounded-lg bg-pitch px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {match.myPrediction ? "Atualizar" : "Palpitar"}
        </button>
      </div>
    </article>
  );
}

function ScoreInput({
  label,
  value,
  disabled,
  onChange
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="block truncate text-xs font-medium text-slate-600">{label}</span>
      <input
        className="mt-1 h-12 w-full rounded-lg border border-slate-200 bg-white text-center text-lg font-bold outline-none focus:border-pitch disabled:bg-slate-100"
        type="number"
        min={0}
        max={99}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
