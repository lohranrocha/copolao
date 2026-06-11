import { FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CalendarClock, CheckCircle2, Gift, Power, RotateCcw, Save, Ticket, Trash2, UsersRound, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "../components/PageHeader";
import { UserAvatar } from "../components/UserAvatar";
import { useAuth } from "../api/auth";
import { api, getApiError } from "../api/client";
import type { AdminBonusQuestion, AdminGroupStanding, InviteCode, Match, User } from "../types/domain";
import { formatDateTimeBR } from "../utils/date";

export function AdminPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [bonusQuestions, setBonusQuestions] = useState<AdminBonusQuestion[]>([]);
  const [groupStandings, setGroupStandings] = useState<AdminGroupStanding[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteLabel, setInviteLabel] = useState("");
  const [inviteMaxUses, setInviteMaxUses] = useState("1");
  const [bonusAnswers, setBonusAnswers] = useState<Record<string, string>>({});
  const [bonusWindowInput, setBonusWindowInput] = useState("");
  const [savingBonusWindow, setSavingBonusWindow] = useState(false);
  const [groupResults, setGroupResults] = useState<Record<string, StandingDraft>>({});
  const [message, setMessage] = useState("");
  const [lastSavedMatchId, setLastSavedMatchId] = useState("");
  const [lastCancelledMatchId, setLastCancelledMatchId] = useState("");

  async function load() {
    const [usersResponse, matchesResponse, invitesResponse, bonusResponse, groupResponse] = await Promise.all([
      api.get<{ users: User[] }>("/users"),
      api.get<{ matches: Match[] }>("/matches"),
      api.get<{ inviteCodes: InviteCode[] }>("/admin/invite-codes"),
      api.get<{ questions: AdminBonusQuestion[] }>("/admin/bonus-questions"),
      api.get<{ groups: AdminGroupStanding[] }>("/admin/group-standings")
    ]);
    setUsers(usersResponse.data.users);
    setMatches(matchesResponse.data.matches);
    setInviteCodes(invitesResponse.data.inviteCodes);
    setBonusQuestions(bonusResponse.data.questions);
    setGroupStandings(groupResponse.data.groups);
    setBonusWindowInput(getBonusWindowInputValue(bonusResponse.data.questions, groupResponse.data.groups));
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
      setLastSavedMatchId(selectedMatchId);
      setLastCancelledMatchId("");
      setMessage("Resultado salvo e pontuação recalculada.");
    } catch (error) {
      setMessage(getApiError(error));
    }
  }

  async function cancelResult() {
    if (!selectedMatch) return;

    const confirmed = window.confirm(`Cancelar o lançamento de ${selectedMatch.homeTeam} x ${selectedMatch.awayTeam}?`);
    if (!confirmed) return;

    setMessage("");
    try {
      await api.delete(`/matches/${selectedMatch.id}/result`);
      await load();
      setLastSavedMatchId("");
      setLastCancelledMatchId(selectedMatch.id);
      setMessage("Lançamento cancelado e pontuação deste jogo zerada.");
    } catch (error) {
      setMessage(getApiError(error));
    }
  }

  async function createInvite(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await api.post("/admin/invite-codes", {
        code: inviteCode,
        label: inviteLabel,
        maxUses: inviteMaxUses ? Number(inviteMaxUses) : null
      });
      setInviteCode("");
      setInviteLabel("");
      setInviteMaxUses("1");
      await load();
      setMessage("Codigo de convite criado.");
    } catch (error) {
      setMessage(getApiError(error));
    }
  }

  async function toggleInvite(invite: InviteCode) {
    setMessage("");
    try {
      await api.patch(`/admin/invite-codes/${invite.id}`, {
        isActive: !invite.isActive
      });
      await load();
      setMessage(invite.isActive ? "Convite desativado." : "Convite ativado.");
    } catch (error) {
      setMessage(getApiError(error));
    }
  }

  async function deleteUser(user: User) {
    const displayName = user.nickname || user.name;
    const confirmed = window.confirm(`Excluir o usuario ${displayName}? Os palpites e bônus dele também serão removidos.`);
    if (!confirmed) return;

    setMessage("");
    try {
      await api.delete(`/users/${user.id}`);
      await load();
      setMessage(`Usuario ${displayName} excluido.`);
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

  async function openBonusWindow(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const lockAtUtc = new Date(bonusWindowInput);
    if (Number.isNaN(lockAtUtc.getTime())) {
      setMessage("Informe uma data válida para reabrir os bônus.");
      return;
    }

    setSavingBonusWindow(true);
    try {
      await api.patch("/admin/bonus-window", {
        mode: "OPEN",
        lockAtUtc: lockAtUtc.toISOString()
      });
      await load();
      setMessage("Bônus reabertos até a data informada.");
    } catch (error) {
      setMessage(getApiError(error));
    } finally {
      setSavingBonusWindow(false);
    }
  }

  async function closeBonusWindow() {
    const confirmed = window.confirm("Fechar todos os bônus agora? Ninguém conseguirá enviar ou editar bônus depois disso.");
    if (!confirmed) return;

    setMessage("");
    setSavingBonusWindow(true);
    try {
      await api.patch("/admin/bonus-window", {
        mode: "CLOSE"
      });
      await load();
      setMessage("Bônus fechados.");
    } catch (error) {
      setMessage(getApiError(error));
    } finally {
      setSavingBonusWindow(false);
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
  const selectedMatchHasResult = Boolean(selectedMatch && selectedMatch.homeScore !== null && selectedMatch.awayScore !== null);
  const selectedMatchSavedNow = selectedMatch?.id === lastSavedMatchId;
  const selectedMatchCancelledNow = selectedMatch?.id === lastCancelledMatchId;

  useEffect(() => {
    if (!selectedMatch) return;
    setHomeScore(selectedMatch.homeScore ?? 0);
    setAwayScore(selectedMatch.awayScore ?? 0);
  }, [selectedMatch?.awayScore, selectedMatch?.homeScore, selectedMatch?.id]);

  return (
    <section>
      <PageHeader title="Admin" description="Operação do bolão: participantes, convites, resultados e bônus." />

      {message ? <p className="mb-4 rounded-lg border border-limebet/25 bg-limebet/10 px-3 py-2 text-sm font-semibold text-limebet">{message}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <div className="space-y-4">
          <Panel title="Participantes" icon={UsersRound}>
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="grid gap-3 rounded-lg bg-ink px-3 py-2 text-sm md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar avatarUrl={user.avatarUrl} name={user.nickname || user.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{user.nickname || user.name}</p>
                      <p className="truncate text-xs text-steel">{user.email}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-limebet/10 px-2 py-1 text-xs font-semibold text-limebet">{user.role}</span>
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-rose-300/25 px-3 text-xs font-bold text-rose-200 transition hover:border-rose-300/45 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={user.id === currentUser?.id}
                    type="button"
                    onClick={() => deleteUser(user)}
                  >
                    <Trash2 size={15} />
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Convites" icon={Ticket}>
            <form className="grid gap-3 md:grid-cols-[1fr_1fr_120px_auto]" onSubmit={createInvite}>
              <input
                className="h-11 rounded-lg border border-white/10 bg-ink px-3 text-sm text-white outline-none focus:border-limebet"
                placeholder="Codigo"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                required
              />
              <input
                className="h-11 rounded-lg border border-white/10 bg-ink px-3 text-sm text-white outline-none focus:border-limebet"
                placeholder="Descricao"
                value={inviteLabel}
                onChange={(event) => setInviteLabel(event.target.value)}
                required
              />
              <input
                className="h-11 rounded-lg border border-white/10 bg-ink px-3 text-sm text-white outline-none focus:border-limebet"
                min={1}
                placeholder="Limite"
                type="number"
                value={inviteMaxUses}
                onChange={(event) => setInviteMaxUses(event.target.value)}
              />
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-limebet px-4 text-sm font-black text-ink" type="submit">
                <Save size={17} />
                Criar
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {inviteCodes.length === 0 ? (
                <p className="rounded-lg bg-ink px-3 py-3 text-sm text-steel">Nenhum codigo criado ainda.</p>
              ) : null}

              {inviteCodes.map((invite) => (
                <div key={invite.id} className="grid gap-2 rounded-lg bg-ink p-3 text-sm md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-black text-white">{invite.code}</p>
                    <p className="truncate text-xs text-steel">
                      {invite.label} · {invite.usedCount}/{invite.maxUses ?? "sem limite"} usos
                    </p>
                  </div>
                  <span className={clsx("w-fit rounded-full px-2 py-1 text-xs font-bold", invite.isActive ? "bg-limebet/10 text-limebet" : "bg-white/10 text-steel")}>
                    {invite.isActive ? "Ativo" : "Inativo"}
                  </span>
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-bold text-white transition hover:border-limebet/50"
                    type="button"
                    onClick={() => toggleInvite(invite)}
                  >
                    <Power size={15} />
                    {invite.isActive ? "Desativar" : "Ativar"}
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Controle dos bônus" icon={CalendarClock}>
            <form className="grid gap-3 md:grid-cols-[1fr_auto_auto]" onSubmit={openBonusWindow}>
              <label className="min-w-0">
                <span className="mb-1 block text-xs font-bold uppercase text-steel">Abrir até</span>
                <input
                  className="h-11 w-full rounded-lg border border-white/10 bg-ink px-3 text-sm text-white outline-none focus:border-limebet"
                  type="datetime-local"
                  value={bonusWindowInput}
                  onChange={(event) => setBonusWindowInput(event.target.value)}
                  required
                />
              </label>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-limebet px-4 text-sm font-black text-ink md:self-end"
                disabled={savingBonusWindow}
                type="submit"
              >
                <Save size={17} />
                Reabrir
              </button>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 text-sm font-black text-amber-100 transition hover:border-amber-300/50 md:self-end"
                disabled={savingBonusWindow}
                type="button"
                onClick={closeBonusWindow}
              >
                <Power size={17} />
                Fechar agora
              </button>
            </form>
            <p className="mt-3 text-xs leading-5 text-steel">
              Esse controle altera as perguntas bônus ainda não apuradas e a ordem final dos grupos. Use horário do Brasil.
            </p>
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

        <form
          className={clsx(
            "h-fit rounded-lg border p-4 text-white shadow-sm transition",
            selectedMatchSavedNow
              ? "border-limebet/60 bg-limebet/[0.09] shadow-glow"
              : selectedMatchCancelledNow
                ? "border-amber-300/45 bg-amber-300/[0.08]"
                : selectedMatchHasResult
                  ? "border-limebet/35 bg-[linear-gradient(145deg,rgba(33,247,102,0.09),rgba(18,19,24,1)_42%)]"
                  : "border-white/10 bg-felt"
          )}
          onSubmit={submitResult}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Lançar resultado</h2>
              <p className="mt-1 text-xs text-steel">Ao trocar o jogo, o placar já lançado aparece automaticamente.</p>
            </div>
            <span
              className={clsx(
                "shrink-0 rounded-full border px-2.5 py-1 text-xs font-black",
                selectedMatchHasResult ? "border-limebet/35 bg-limebet/10 text-limebet" : "border-white/10 bg-white/5 text-steel"
              )}
            >
              {selectedMatchHasResult ? "Lançada" : "Pendente"}
            </span>
          </div>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-white/80">Jogo</span>
            <select
              className={clsx(
                "mt-1 h-12 w-full rounded-lg border bg-ink px-3 text-sm text-white outline-none focus:border-limebet",
                selectedMatchHasResult ? "border-limebet/30" : "border-white/10"
              )}
              value={selectedMatchId}
              onChange={(event) => setSelectedMatchId(event.target.value)}
            >
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.homeScore !== null && match.awayScore !== null ? "✓ " : ""}
                  #{match.matchNumber} {match.homeTeam} x {match.awayTeam}
                  {match.homeScore !== null && match.awayScore !== null ? ` (${match.homeScore}-${match.awayScore})` : ""}
                </option>
              ))}
            </select>
          </label>

          {selectedMatch ? (
            <div className="mt-3 rounded-lg border border-white/10 bg-ink px-3 py-3 text-xs text-steel">
              <p>
                Grupo {selectedMatch.groupCode} · {formatDateTimeBR(selectedMatch.matchDateUtc)}
              </p>
              {selectedMatchHasResult ? (
                <p className="mt-2 font-black text-limebet">
                  Resultado lançado: {selectedMatch.homeTeam} {selectedMatch.homeScore} x {selectedMatch.awayScore} {selectedMatch.awayTeam}
                </p>
              ) : (
                <p className="mt-2 font-bold text-amber-200">Resultado ainda não lançado.</p>
              )}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <Score label={selectedMatch?.homeTeam ?? "Casa"} value={homeScore} onChange={setHomeScore} />
            <span className="pb-3 font-bold text-steel">x</span>
            <Score label={selectedMatch?.awayTeam ?? "Visitante"} value={awayScore} onChange={setAwayScore} />
          </div>

          <div className="mt-4 grid gap-2">
            <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-limebet font-black text-ink" type="submit">
              {selectedMatchSavedNow ? <CheckCircle2 size={18} /> : null}
              {selectedMatchHasResult ? "Atualizar resultado" : "Salvar resultado"}
            </button>

            {selectedMatchHasResult ? (
              <button
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-rose-300/30 bg-rose-500/10 font-black text-rose-200 transition hover:border-rose-300/50 hover:bg-rose-500/15"
                type="button"
                onClick={cancelResult}
              >
                <RotateCcw size={18} />
                Cancelar lançamento
              </button>
            ) : null}
          </div>

          {selectedMatchSavedNow ? (
            <p className="mt-3 rounded-lg border border-limebet/35 bg-limebet/10 px-3 py-2 text-sm font-bold text-limebet">
              Partida marcada como lançada e pontuação recalculada.
            </p>
          ) : null}

          {selectedMatchCancelledNow ? (
            <p className="mt-3 rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm font-bold text-amber-100">
              Lançamento cancelado. A partida voltou para pendente.
            </p>
          ) : null}
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
  return { ...emptyStanding };
}

function getBonusWindowInputValue(questions: AdminBonusQuestion[], groups: AdminGroupStanding[]) {
  const dates = [
    ...questions.filter((question) => question.computedState !== "SETTLED").map((question) => question.lockAtUtc),
    ...groups.filter((group) => group.computedState !== "SETTLED").map((group) => group.lockAtUtc)
  ];

  const latestDate = dates.reduce<Date | null>((latest, date) => {
    const parsedDate = new Date(date);
    if (!latest || parsedDate > latest) return parsedDate;
    return latest;
  }, null);

  return toDateTimeLocalInput(latestDate ?? new Date(Date.now() + 60 * 60 * 1000));
}

function toDateTimeLocalInput(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-") + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
