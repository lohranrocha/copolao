import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import clsx from "clsx";
import { TeamFlag } from "./TeamFlag";
import type { Match } from "../types/domain";
import { formatFullDateTimeBR } from "../utils/date";
import { matchCompetitionLabel, matchStateLabel, matchStateTone } from "../utils/match";
import { getTeamAsset, type TeamAsset } from "../utils/teamAssets";

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
  const hasPrediction = Boolean(match.myPrediction);
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
    <article
      className={clsx(
        "overflow-hidden rounded-lg border shadow-sm transition",
        hasPrediction
          ? "border-limebet/45 bg-[linear-gradient(145deg,rgba(33,247,102,0.12),rgba(22,24,31,0.98)_34%)] shadow-glow"
          : "border-white/10 bg-felt"
      )}
    >
      <div className={clsx("flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3", hasPrediction ? "border-limebet/20 bg-limebet/[0.06]" : "border-white/10 bg-white/[0.03]")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-limebet px-2 py-1 text-[11px] font-black uppercase text-ink">
            {matchCompetitionLabel(match.stage, match.groupCode)}
          </span>
          <time className="rounded-full border border-white/10 bg-ink px-2.5 py-1 text-xs font-bold text-white">
            {formatFullDateTimeBR(match.matchDateUtc)}
          </time>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {hasPrediction ? (
            <span className="rounded-full border border-limebet/35 bg-limebet/10 px-2.5 py-1 text-xs font-black text-limebet">
              Palpite feito
            </span>
          ) : null}
          <span className={clsx("rounded-full border px-2.5 py-1 text-xs font-semibold", matchStateTone(match.computedState))}>
            {matchStateLabel(match.computedState)}
          </span>
        </div>
      </div>

      {match.homeScore !== null && match.awayScore !== null ? (
        <div className="mx-4 mt-4 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white">
          Resultado: {match.homeTeam} {match.homeScore} x {match.awayScore} {match.awayTeam}
        </div>
      ) : null}

      <div className="space-y-3 p-4">
        <TeamScoreRow
          asset={homeAsset}
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
          asset={awayAsset}
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
          <p className="mt-0.5 text-[11px] font-semibold text-steel">Fecha em {formatFullDateTimeBR(match.lockAtUtc)}</p>
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
  asset,
  label,
  value,
  disabled,
  onChange
}: {
  asset: TeamAsset;
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
        <TeamFlag asset={asset} label={label} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-white">{label}</span>
          <span className="text-xs font-semibold text-steel">{asset.code}</span>
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
