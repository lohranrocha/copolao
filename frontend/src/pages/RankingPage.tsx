import { useEffect, useState } from "react";
import { Medal, Trophy } from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "../components/PageHeader";
import { api } from "../api/client";
import type { RankingEntry } from "../types/domain";

export function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);

  useEffect(() => {
    void api.get<{ ranking: RankingEntry[] }>("/ranking").then(({ data }) => setRanking(data.ranking));
  }, []);

  return (
    <section>
      <PageHeader title="Ranking" description="Ordenado por pontos, placares exatos, resultados certos e palpites enviados." />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {ranking.slice(0, 3).map((entry) => (
          <article key={entry.user.id} className={clsx("rounded-lg border p-4 text-white shadow-sm", podiumTone(entry.position))}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-steel">{entry.position}º colocado</p>
                <h2 className="mt-1 truncate text-lg font-black">{entry.user.nickname || entry.user.name}</h2>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-limebet text-ink">
                {entry.position === 1 ? <Trophy size={21} /> : <Medal size={21} />}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <PodiumMetric label="Pontos" value={entry.totalPoints} highlight />
              <PodiumMetric label="Exatos" value={entry.exactScores} />
              <PodiumMetric label="Bônus" value={entry.bonusPoints} />
            </div>
          </article>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-felt text-white shadow-sm">
        <div className="grid grid-cols-[48px_1fr_72px_58px_58px] items-center gap-2 border-b border-limebet/25 bg-limebet px-3 py-2 text-[11px] font-black uppercase text-ink md:grid-cols-[58px_1fr_90px_70px_70px_70px]">
          <span>Pos</span>
          <span>Participante</span>
          <span className="text-right">Pontos</span>
          <span className="text-right">Exatos</span>
          <span className="text-right">Res.</span>
          <span className="hidden text-right md:block">Bônus</span>
        </div>

        <div className="divide-y divide-white/10">
          {ranking.map((entry) => (
            <article
              key={entry.user.id}
              className={clsx(
                "grid grid-cols-[48px_1fr_72px_58px_58px] items-center gap-2 px-3 py-3 text-sm transition md:grid-cols-[58px_1fr_90px_70px_70px_70px]",
                entry.position <= 3 ? "bg-limebet/[0.06]" : "bg-ink/55"
              )}
            >
              <div className={clsx("grid h-8 w-8 place-items-center rounded-md text-xs font-black", positionTone(entry.position))}>
                {entry.position}
              </div>
              <div className="min-w-0">
                <p className="truncate font-black">{entry.user.nickname || entry.user.name}</p>
                <p className="truncate text-[11px] font-semibold text-steel">
                  Jogos {entry.matchPoints} pts · {entry.missedPredictions} sem palpite
                </p>
              </div>
              <strong className="text-right text-base text-limebet">{entry.totalPoints}</strong>
              <span className="text-right font-bold text-white/85">{entry.exactScores}</span>
              <span className="text-right font-bold text-white/85">{entry.correctResults}</span>
              <span className="hidden text-right font-bold text-white/85 md:block">{entry.bonusPoints}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PodiumMetric({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={clsx("rounded-lg border px-2 py-2", highlight ? "border-limebet/35 bg-limebet/10" : "border-white/10 bg-ink/70")}>
      <p className={clsx("text-base font-black", highlight ? "text-limebet" : "text-white")}>{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase text-steel">{label}</p>
    </div>
  );
}

function podiumTone(position: number) {
  if (position === 1) return "border-limebet/45 bg-[linear-gradient(145deg,rgba(33,247,102,0.14),rgba(18,19,24,1)_42%)] shadow-glow";
  if (position === 2) return "border-sky-300/25 bg-[linear-gradient(145deg,rgba(125,211,252,0.12),rgba(18,19,24,1)_42%)]";
  return "border-amber-300/25 bg-[linear-gradient(145deg,rgba(252,211,77,0.11),rgba(18,19,24,1)_42%)]";
}

function positionTone(position: number) {
  if (position === 1) return "bg-limebet text-ink";
  if (position === 2) return "bg-sky-300 text-ink";
  if (position === 3) return "bg-amber-300 text-ink";
  return "bg-white/10 text-white";
}
