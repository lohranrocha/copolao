import { FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, Gift, Save, UsersRound, type LucideIcon } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { api, getApiError } from "../api/client";
import type { AdminBonusQuestion, AdminGroupStanding, Match, User } from "../types/domain";
import { formatDateTimeBR } from "../utils/date";

export function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [bonusQuestions, setBonusQuestions] = useState<AdminBonusQuestion[]>([]);
  const [groupStandings, setGroupStandings] = useState<AdminGroupStanding[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [bonusAnswers, setBonusAnswers] = useState<Record<string, string>>({});
  const [groupResults, setGroupResults] = useState<Record<string, StandingDraft>>({});
  const [message, setMessage] = useState("");

  async function load() {
    const [usersResponse, matchesResponse, bonusResponse, groupResponse] = await Promise.all([
      api.get<{ users: User[] }>("/users"),
      api.get<{ matches: Match[] }>("/matches"),
      api.get<{ questions: AdminBonusQuestion[] }>("/admin/bonus-questions"),
      api.get<{ groups: AdminGroupStanding[] }>("/admin/group-standings")
    ]);
    setUsers(usersResponse.data.users);
    setMatches(matchesResponse.data.matches);
    setBonusQuestions(bonusResponse.data.questions);
    setGroupStandings(groupResponse.data.groups);
    setBonusAnswers(Object.fromEntries(bonusResponse.data.questions.map((question) => [question.id, question.correctAnswer ?? ""])));
    setGroupResults(
      Object.fromEntries(
        groupResponse.data.groups.map((group) => [
          group.groupCode,
          group.result
            ? {
                firstTeam: group.result.firstTeam,
                secondTeam: group.result.secondTeam,
                thirdTeam: group.result.thirdTeam,
                fourthTeam: group.result.fourthTeam
              }
            : blankStanding(group.teams)
        ])
      )
    );
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
      setMessage("Resultado salvo e pontuação recalculada.");
    } catch (error) {
      setMessage(getApiError(error));
    }
  }

  async function saveBonusResult(questionId: string) {
    setMessage("");
    try {
      await api.patch(`/admin/bonus-questions/${questionId}/result`, {
        correctAnswer: bonusAnswers[questionId] ?? ""
      });
      await load();
      setMessage("Bônus apurado e ranking atualizado.");
    } catch (error) {
      setMessage(getApiError(error));
    }
  }

  async function saveGroupResult(groupCode: string) {
    setMessage("");
    try {
      await api.patch(`/admin/group-standings/${groupCode}/result`, groupResults[groupCode]);
      await load();
      setMessage(`Classificação do Grupo ${groupCode} apurada e ranking atualizado.`);
    } catch (error) {
      setMessage(getApiError(error));
    }
  }

  function updateGroupResult(groupCode: string, field: keyof StandingDraft, team: string) {
    setGroupResults((current) => ({
      ...current,
      [groupCode]: {
        ...(current[groupCode] ?? emptyStanding),
        [field]: team
      }
    }));
  }

  const selectedMatch = matches.find((match) => match.id === selectedMatchId);

  return (
    <section>
      <PageHeader title="Admin" description="Operação do bolão: participantes, resultados e bônus." />

      {message ? <p className="mb-4 rounded-lg border border-limebet/25 bg-limebet/10 px-3 py-2 text-sm font-semibold text-limebet">{message}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <div className="space-y-4">
          <Panel title="Participantes" icon={UsersRound}>
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 rounded-lg bg-ink px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{user.nickname || user.name}</p>
                    <p className="truncate text-xs text-steel">{user.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-limebet/10 px-2 py-1 text-xs font-semibold text-limebet">{user.role}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Apurar bônus" icon={Gift}>
            <div className="space-y-3">
              {bonusQuestions.map((question) => (
                <div key={question.id} className="rounded-lg bg-ink p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-black">{question.title}</p>
                      <p className="text-xs leading-5 text-steel">
                        {question.points} pts · Fecha em {formatDateTimeBR(question.lockAtUtc)} · {question.predictions.length} palpites
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-limebet/10 px-2 py-1 text-xs font-bold text-limebet">{bonusLabel(question.computedState)}</span>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                    <input
                      className="h-11 rounded-lg border border-white/10 bg-felt px-3 text-sm text-white outline-none focus:border-limebet"
                      placeholder="Resposta correta"
                      value={bonusAnswers[question.id] ?? ""}
                      onChange={(event) => setBonusAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                    />
                    <button
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-limebet px-4 text-sm font-black text-ink"
                      type="button"
                      onClick={() => saveBonusResult(question.id)}
                    >
                      <CheckCircle2 size={17} />
                      Apurar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Apurar grupos" icon={CheckCircle2}>
            <div className="space-y-3">
              {groupStandings.map((group) => (
                <GroupResultAdminCard
                  key={group.groupCode}
                  group={group}
                  value={groupResults[group.groupCode] ?? blankStanding(group.teams)}
                  onChange={(field, team) => updateGroupResult(group.groupCode, field, team)}
                  onSave={() => saveGroupResult(group.groupCode)}
                />
              ))}
            </div>
          </Panel>
        </div>

        <form className="h-fit rounded-lg border border-white/10 bg-felt p-4 text-white shadow-sm" onSubmit={submitResult}>
          <h2 className="text-lg font-bold">Lançar resultado</h2>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-white/80">Jogo</span>
            <select
              className="mt-1 h-12 w-full rounded-lg border border-white/10 bg-ink px-3 text-sm text-white outline-none focus:border-limebet"
              value={selectedMatchId}
              onChange={(event) => setSelectedMatchId(event.target.value)}
            >
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  #{match.matchNumber} {match.homeTeam} x {match.awayTeam}
                </option>
              ))}
            </select>
          </label>

          {selectedMatch ? (
            <p className="mt-2 text-xs text-steel">
              Grupo {selectedMatch.groupCode} · {formatDateTimeBR(selectedMatch.matchDateUtc)}
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <Score label={selectedMatch?.homeTeam ?? "Casa"} value={homeScore} onChange={setHomeScore} />
            <span className="pb-3 font-bold text-steel">x</span>
            <Score label={selectedMatch?.awayTeam ?? "Visitante"} value={awayScore} onChange={setAwayScore} />
          </div>

          <button className="mt-4 h-11 w-full rounded-lg bg-limebet font-black text-ink" type="submit">
            Salvar resultado
          </button>
        </form>
      </div>
    </section>
  );
}

function Panel({
  title,
  icon: Icon,
  children
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-felt p-4 text-white shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-limebet text-ink">
          <Icon size={19} />
        </div>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
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
      <span className="block truncate text-xs font-medium text-steel">{label}</span>
      <input
        className="mt-1 h-12 w-full rounded-lg border border-white/10 bg-ink text-center text-lg font-bold text-white outline-none focus:border-limebet"
        min={0}
        max={99}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

type StandingDraft = {
  firstTeam: string;
  secondTeam: string;
  thirdTeam: string;
  fourthTeam: string;
};

const emptyStanding: StandingDraft = {
  firstTeam: "",
  secondTeam: "",
  thirdTeam: "",
  fourthTeam: ""
};

const standingFields: Array<{ key: keyof StandingDraft; label: string }> = [
  { key: "firstTeam", label: "1º" },
  { key: "secondTeam", label: "2º" },
  { key: "thirdTeam", label: "3º" },
  { key: "fourthTeam", label: "4º" }
];

function blankStanding(_teams: string[]): StandingDraft {
  return emptyStanding;
}

function GroupResultAdminCard({
  group,
  value,
  onChange,
  onSave
}: {
  group: AdminGroupStanding;
  value: StandingDraft;
  onChange: (field: keyof StandingDraft, team: string) => void;
  onSave: () => void;
}) {
  const selectedTeams = new Set(Object.values(value).filter(Boolean));
  const isComplete = Object.values(value).every(Boolean) && selectedTeams.size === 4;

  return (
    <div className="rounded-lg bg-ink p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-black">Grupo {group.groupCode}</p>
          <p className="text-xs leading-5 text-steel">
            {group.predictionCount} palpites · Fecha em {formatDateTimeBR(group.lockAtUtc)}
          </p>
        </div>
        <span className="w-fit rounded-full bg-limebet/10 px-2 py-1 text-xs font-bold text-limebet">{group.result ? "Apurado" : "Pendente"}</span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-4">
        {standingFields.map((field) => {
          const currentTeam = value[field.key];
          return (
            <label key={field.key}>
              <span className="mb-1 block text-xs font-bold text-steel">{field.label}</span>
              <select
                className="h-11 w-full rounded-lg border border-white/10 bg-felt px-2 text-sm text-white outline-none focus:border-limebet"
                value={currentTeam}
                onChange={(event) => onChange(field.key, event.target.value)}
              >
                <option value="">Time</option>
                {group.teams.map((team) => {
                  const isUsedElsewhere = selectedTeams.has(team) && currentTeam !== team;
                  return (
                    <option key={team} value={team} disabled={isUsedElsewhere}>
                      {team}
                    </option>
                  );
                })}
              </select>
            </label>
          );
        })}
      </div>

      <button
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-limebet px-4 text-sm font-black text-ink disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        disabled={!isComplete}
        type="button"
        onClick={onSave}
      >
        <CheckCircle2 size={17} />
        Apurar grupo
      </button>
    </div>
  );
}

function bonusLabel(state: AdminBonusQuestion["computedState"]) {
  if (state === "SETTLED") return "Apurado";
  if (state === "LOCKED") return "Fechado";
  return "Aberto";
}
