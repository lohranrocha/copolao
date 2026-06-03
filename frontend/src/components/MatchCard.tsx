import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
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

  function changeHomeScore(value: number) {
    setHome(clampScore(value));
  }

  function changeAwayScore(value: number) {
    setAway(clampScore(value));
  }

  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-felt shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-limebet px-2 py-1 text-[11px] font-black uppercase text-ink">Grupo {match.groupCode}</span>
          <time className="text-xs font-semibold text-steel">{formatTimeBR(match.matchDateUtc)}</time>
        </div>
        <span className={clsx("shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold", matchStateTone(match.computedState))}>
          {matchStateLabel(match.computedState)}
        </span>
      </div>

      {match.homeScore !== null && match.awayScore !== null ? (
        <div className="mx-4 mt-4 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white">
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
          onChange={changeHomeScore}
        />
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-black uppercase tracking-wide text-limebet">versus</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <TeamScoreRow
          code={awayAsset.code}
          flag={awayAsset.flag}
          label={match.awayTeam}
          value={away}
          disabled={!canEdit}
          onChange={changeAwayScore}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-steel">
            {match.myPrediction ? `${match.myPrediction.points} ponto(s) neste jogo` : "Sem palpite enviado"}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-steel">Fecha às {formatTimeBR(match.lockAtUtc)}</p>
        </div>
        <button
          type="button"
          disabled={!canEdit || saving}
          onClick={submit}
          className="h-10 rounded-lg bg-limebet px-4 text-sm font-black text-ink transition hover:bg-mintbet disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-steel"
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
  function step(delta: number) {
    onChange(value + delta);
  }

  return (
    <div className="grid grid-cols-[1fr_126px] items-center gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white text-2xl shadow-sm">
          {flag}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-white">{label}</span>
          <span className="text-xs font-semibold text-steel">{code}</span>
        </span>
      </div>
      <div className="grid h-14 grid-cols-[36px_1fr_36px] overflow-hidden rounded-lg border border-white/10 bg-ink">
        <button
          aria-label={`Diminuir placar de ${label}`}
          className="grid place-items-center border-r border-white/10 text-steel transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled || value <= 0}
          type="button"
          onClick={() => step(-1)}
        >
          <Minus size={16} />
        </button>
        <input
          aria-label={`Placar de ${label}`}
          className="min-w-0 bg-transparent text-center text-xl font-black text-white outline-none transition focus:bg-limebet/10 disabled:bg-white/5"
          type="number"
          inputMode="numeric"
          min={0}
          max={99}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <button
          aria-label={`Aumentar placar de ${label}`}
          className="grid place-items-center border-l border-white/10 text-limebet transition hover:bg-limebet/10 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled || value >= 99}
          type="button"
          onClick={() => step(1)}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function clampScore(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 99);
}
