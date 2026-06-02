import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { api, getApiError } from "../api/client";
import type { Match, User } from "../types/domain";
import { formatDateTimeBR } from "../utils/date";

export function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [message, setMessage] = useState("");

  async function load() {
    const [usersResponse, matchesResponse] = await Promise.all([
      api.get<{ users: User[] }>("/users"),
      api.get<{ matches: Match[] }>("/matches")
    ]);
    setUsers(usersResponse.data.users);
    setMatches(matchesResponse.data.matches);
    setSelectedMatchId((current) => current || matchesResponse.data.matches[0]?.id || "");
  }

  useEffect(() => {
    void load();
  }, []);

  async function submitResult(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await api.patch(`/matches/${selectedMatchId}/result`, {
        homeScore,
        awayScore
      });
      await load();
      setMessage("Resultado salvo e pontuacao recalculada.");
    } catch (error) {
      setMessage(getApiError(error));
    }
  }

  const selectedMatch = matches.find((match) => match.id === selectedMatchId);

  return (
    <section>
      <PageHeader title="Admin" description="Gerencie resultados e acompanhe participantes. Jogos nao sao editaveis pela aplicacao." />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold">Participantes</h2>
          <div className="mt-4 space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user.nickname || user.name}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600">{user.role}</span>
              </div>
            ))}
          </div>
        </div>

        <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={submitResult}>
          <h2 className="text-lg font-bold">Lancar resultado</h2>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">Jogo</span>
            <select
              className="mt-1 h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-pitch"
              value={selectedMatchId}
              onChange={(event) => setSelectedMatchId(event.target.value)}
            >
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.homeTeam} x {match.awayTeam}
                </option>
              ))}
            </select>
          </label>

          {selectedMatch ? (
            <p className="mt-2 text-xs text-slate-500">
              Grupo {selectedMatch.groupCode} · {formatDateTimeBR(selectedMatch.matchDateUtc)}
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <Score label={selectedMatch?.homeTeam ?? "Casa"} value={homeScore} onChange={setHomeScore} />
            <span className="pb-3 font-bold text-slate-400">x</span>
            <Score label={selectedMatch?.awayTeam ?? "Visitante"} value={awayScore} onChange={setAwayScore} />
          </div>

          {message ? <p className="mt-4 rounded-lg bg-skyline px-3 py-2 text-sm text-night">{message}</p> : null}

          <button className="mt-4 h-11 w-full rounded-lg bg-night font-semibold text-white" type="submit">
            Salvar resultado
          </button>
        </form>
      </div>
    </section>
  );
}

function Score({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="block truncate text-xs font-medium text-slate-600">{label}</span>
      <input
        className="mt-1 h-12 w-full rounded-lg border border-slate-200 text-center text-lg font-bold outline-none focus:border-pitch"
        min={0}
        max={99}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
