import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { MatchCard } from "../components/MatchCard";
import { api, getApiError } from "../api/client";
import type { Match } from "../types/domain";

export function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [group, setGroup] = useState("ALL");
  const [message, setMessage] = useState("");

  async function loadMatches() {
    const { data } = await api.get<{ matches: Match[] }>("/matches");
    setMatches(data.matches);
  }

  useEffect(() => {
    void loadMatches();
  }, []);

  const groups = useMemo(
    () => ["ALL", ...Array.from(new Set(matches.map((match) => match.groupCode).filter((value): value is string => Boolean(value))))],
    [matches]
  );
  const visibleMatches = group === "ALL" ? matches : matches.filter((match) => match.groupCode === group);

  async function savePrediction(matchId: string, home: number, away: number) {
    setMessage("");
    try {
      await api.put(`/matches/${matchId}/prediction`, {
        homeScorePrediction: home,
        awayScorePrediction: away
      });
      await loadMatches();
      setMessage("Palpite salvo.");
    } catch (error) {
      setMessage(getApiError(error));
    }
  }

  return (
    <section>
      <PageHeader title="Jogos" description="Palpites fecham uma hora antes do inicio da partida no horario do Brasil." />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {groups.map((item) => (
          <button
            key={item}
            className={`h-10 shrink-0 rounded-lg border px-4 text-sm font-semibold ${
              group === item ? "border-pitch bg-pitch text-white" : "border-slate-200 bg-white text-slate-600"
            }`}
            type="button"
            onClick={() => setGroup(item)}
          >
            {item === "ALL" ? "Todos" : `Grupo ${item}`}
          </button>
        ))}
      </div>

      {message ? <p className="mb-4 rounded-lg bg-skyline px-3 py-2 text-sm text-night">{message}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleMatches.map((match) => (
          <MatchCard key={match.id} match={match} onSavePrediction={savePrediction} />
        ))}
      </div>
    </section>
  );
}
