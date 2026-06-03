import { useEffect, useState } from "react";
import clsx from "clsx";
import type { Match } from "../types/domain";
import { formatTimeBR } from "../utils/date";
import { matchStateLabel, matchStateTone } from "../utils/match";
import { getTeamAsset } from "../utils/teamAssets";

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
  const homeAsset = getTeamAsset(match.homeTeam);
  const awayAsset = getTeamAsset(match.awayTeam);

  useEffect(() => {
    setHome(match.myPrediction?.homeScorePrediction ?? 0);
    setAway(match.myPrediction?.awayScorePrediction ?? 0);
  }, [match.myPrediction?.awayScorePrediction, match.myPrediction?.homeScorePrediction]);

  async function submit() {
    setSaving(true);
    try {
      await onSavePrediction(match.id, home, away);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-black/5 bg-stone-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-obsidian px-2 py-1 text-[11px] font-bold uppercase text-gold">Grupo {match.groupCode}</span>
          <time className="text-xs font-semibold text-slate-500">{formatTimeBR(match.matchDateUtc)}</time>
        </div>
        <span className={clsx("shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold", matchStateTone(match.computedState))}>
          {matchStateLabel(match.computedState)}
        </span>
      </div>

      {match.homeScore !== null && match.awayScore !== null ? (
        <div className="mx-4 mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold">
          Resultado: {match.homeTeam} {match.homeScore} x {match.awayScore} {match.awayTeam}
        </div>
      ) : null}

      <div className="space-y-3 p-4">
        <TeamScoreRow
          code={homeAsset.code}
          flag={homeAsset.flag}
          label={match.homeTeam}
          value={home}
          disabled={!canEdit}
          onChange={setHome}
        />
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-black/10" />
          <span className="text-xs font-black uppercase tracking-wide text-gold">versus</span>
          <div className="h-px flex-1 bg-black/10" />
        </div>
        <TeamScoreRow
          code={awayAsset.code}
          flag={awayAsset.flag}
          label={match.awayTeam}
          value={away}
          disabled={!canEdit}
          onChange={setAway}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-black/5 bg-stone-50 px-4 py-3">
        <p className="text-xs font-medium text-slate-500">
          {match.myPrediction ? `${match.myPrediction.points} ponto(s) neste jogo` : "Sem palpite enviado"}
        </p>
        <button
          type="button"
          disabled={!canEdit || saving}
          onClick={submit}
          className="h-10 rounded-lg bg-obsidian px-4 text-sm font-bold text-gold transition hover:bg-graphite disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {match.myPrediction ? "Atualizar" : "Palpitar"}
        </button>
      </div>
    </article>
  );
}

function TeamScoreRow({
  code,
  flag,
  label,
  value,
  disabled,
  onChange
}: {
  code: string;
  flag: string;
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid grid-cols-[1fr_72px] items-center gap-3">
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-2xl shadow-sm">
          {flag}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-night">{label}</span>
          <span className="text-xs font-semibold text-slate-400">{code}</span>
        </span>
      </span>
      <input
        className="h-14 w-full rounded-lg border border-slate-200 bg-white text-center text-xl font-black outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 disabled:bg-slate-100"
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
