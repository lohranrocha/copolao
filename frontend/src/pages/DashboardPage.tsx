import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { api } from "../api/client";
import { useAuth } from "../api/auth";
import type { Match, RankingEntry } from "../types/domain";
import { formatDateTimeBR } from "../utils/date";

export function DashboardPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);

  useEffect(() => {
    void Promise.all([
      api.get<{ matches: Match[] }>("/matches").then(({ data }) => setMatches(data.matches)),
      api.get<{ ranking: RankingEntry[] }>("/ranking").then(({ data }) => setRanking(data.ranking))
    ]);
  }, []);

  const myRank = ranking.find((entry) => entry.user.id === user?.id);
  const nextMatches = useMemo(() => matches.filter((match) => match.computedState === "OPEN").slice(0, 3), [matches]);
  const sentPredictions = matches.filter((match) => match.myPrediction).length;

  return (
    <section>
      <PageHeader
        title="Resumo"
        description="Acompanhe sua posicao, seus palpites e os proximos jogos."
        action={user?.role === "ADMIN" ? (
          <Link className="hidden h-10 items-center rounded-lg bg-obsidian px-4 text-sm font-bold text-gold md:flex" to="/admin">
            Admin
          </Link>
        ) : null}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Posicao" value={myRank ? `${myRank.position}o` : "-"} />
        <StatCard label="Pontos" value={myRank?.totalPoints ?? 0} />
        <StatCard label="Exatos" value={myRank?.exactScores ?? 0} />
        <StatCard label="Palpites" value={sentPredictions} />
      </div>

      <div className="mt-6 rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold">Proximos jogos abertos</h2>
        <div className="mt-4 space-y-3">
          {nextMatches.map((match) => (
            <Link key={match.id} className="block rounded-lg bg-slate-50 p-3" to="/jogos">
              <p className="text-xs font-medium uppercase text-slate-500">Grupo {match.groupCode} · {formatDateTimeBR(match.matchDateUtc)}</p>
              <p className="mt-1 font-semibold">
                {match.homeTeam} x {match.awayTeam}
              </p>
            </Link>
          ))}
          {nextMatches.length === 0 ? <p className="text-sm text-slate-500">Nenhum jogo aberto no momento.</p> : null}
        </div>
      </div>
    </section>
  );
}
