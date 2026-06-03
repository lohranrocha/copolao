import { useEffect, useState } from "react";
import { Medal } from "lucide-react";
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
      <div className="space-y-3">
        {ranking.map((entry) => (
          <article key={entry.user.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-felt p-4 text-white shadow-sm">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-limebet font-black text-ink">
              {entry.position <= 3 ? <Medal size={20} /> : entry.position}
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold">{entry.user.nickname || entry.user.name}</p>
              <p className="text-xs text-steel">
                {entry.exactScores} exatos · {entry.correctResults} resultados · {entry.missedPredictions} ausentes
              </p>
              <p className="mt-1 text-xs text-steel">
                Jogos {entry.matchPoints} pts · Bônus {entry.bonusPoints} pts
              </p>
            </div>
            <strong className="text-xl text-limebet">{entry.totalPoints}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
