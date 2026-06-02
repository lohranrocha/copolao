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
          <article key={entry.user.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 font-bold">
              {entry.position <= 3 ? <Medal className="text-trophy" size={20} /> : entry.position}
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold">{entry.user.nickname || entry.user.name}</p>
              <p className="text-xs text-slate-500">
                {entry.exactScores} exatos · {entry.correctResults} resultados · {entry.missedPredictions} ausentes
              </p>
            </div>
            <strong className="text-xl">{entry.totalPoints}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
