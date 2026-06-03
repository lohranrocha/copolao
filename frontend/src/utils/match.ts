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
    OPEN: "bg-limebet/15 text-limebet border-limebet/35",
    LOCKED: "bg-amber-400/15 text-amber-300 border-amber-300/35",
    FINISHED: "bg-white/10 text-white/75 border-white/15",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200"
  };

  return tones[state];
}
