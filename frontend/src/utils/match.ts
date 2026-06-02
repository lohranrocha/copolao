import type { ComputedMatchState } from "../types/domain";

export function matchStateLabel(state: ComputedMatchState) {
  const labels: Record<ComputedMatchState, string> = {
    OPEN: "Aberto",
    LOCKED: "Fechado",
    FINISHED: "Finalizado",
    CANCELLED: "Cancelado"
  };

  return labels[state];
}

export function matchStateTone(state: ComputedMatchState) {
  const tones: Record<ComputedMatchState, string> = {
    OPEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
    LOCKED: "bg-amber-50 text-amber-700 border-amber-200",
    FINISHED: "bg-skyline text-night border-slate-200",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200"
  };

  return tones[state];
}
