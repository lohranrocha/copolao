import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpenCheck, Eye, Gift, ListOrdered, Medal, MessageCircle, Trophy } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { FinalWinnersBanner } from "../components/FinalWinnersBanner";
import { api } from "../api/client";
import { useAuth } from "../api/auth";
import type { BonusQuestion, GroupStandingBonus, Match, RankingEntry } from "../types/domain";
import { formatDateTimeBR } from "../utils/date";
import whatsappGroupQr from "../assets/whatsapp-group-qr.svg";

const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/F2kU4K3YZ9NKtw1qsvWX3F?s=cl&p=i&ilr=1";

type BonusOverview = {
  questions: BonusQuestion[];
  groupStandings: GroupStandingBonus[];
};

export function DashboardPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [bonus, setBonus] = useState<BonusOverview>({ questions: [], groupStandings: [] });

  useEffect(() => {
    void Promise.all([
      api.get<{ matches: Match[] }>("/matches").then(({ data }) => setMatches(data.matches)),
      api.get<{ ranking: RankingEntry[] }>("/ranking").then(({ data }) => setRanking(data.ranking)),
      api.get<BonusOverview>("/bonus").then(({ data }) => setBonus(data))
    ]);
  }, []);

  const myRank = ranking.find((entry) => entry.user.id === user?.id);
  const isCopolaoFinished = matches.some((match) => match.stage === "FINAL" && match.status === "FINISHED");
  const nextMatches = useMemo(() => matches.filter((match) => match.computedState === "OPEN").slice(0, 3), [matches]);
  const sentPredictions = matches.filter((match) => match.myPrediction).length;
  const sentGroupStandings = bonus.groupStandings.filter((group) => group.myPrediction).length;
  const sentBonusQuestions = bonus.questions.filter((question) => question.myPrediction).length;

  return (
    <section>
      <PageHeader
        title={isCopolaoFinished ? "Copolão finalizado" : "Resumo"}
        description={isCopolaoFinished ? "Veja o pódio final, sua posição e a classificação completa." : "Acompanhe sua posicao, seus palpites e os proximos jogos."}
        action={user?.role === "ADMIN" ? (
          <Link className="hidden h-10 items-center rounded-lg bg-limebet px-4 text-sm font-black text-ink md:flex" to="/admin">
            Admin
          </Link>
        ) : null}
      />

      {isCopolaoFinished ? <FinalWinnersBanner ranking={ranking} /> : null}

      <WhatsAppGroupInvite />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Posicao" value={myRank ? `${myRank.position}o` : "-"} />
        <StatCard label="Pontos" value={myRank?.totalPoints ?? 0} />
        <StatCard label="Exatos" value={myRank?.exactScores ?? 0} />
        <StatCard label="Palpites" value={sentPredictions} />
      </div>

      {isCopolaoFinished ? null : (
        <>
          <FirstAccessRoadmap
            matchCount={matches.length}
            sentPredictions={sentPredictions}
            groupCount={bonus.groupStandings.length}
            sentGroupStandings={sentGroupStandings}
            bonusQuestionCount={bonus.questions.length}
            sentBonusQuestions={sentBonusQuestions}
          />

          <div className="mt-6 rounded-lg border border-white/10 bg-felt p-4 text-white shadow-sm">
            <h2 className="text-lg font-bold">Proximos jogos abertos</h2>
            <div className="mt-4 space-y-3">
              {nextMatches.map((match) => (
                <Link key={match.id} className="block rounded-lg border border-white/10 bg-ink p-3" to="/jogos">
                  <p className="text-xs font-medium uppercase text-steel">Grupo {match.groupCode} · {formatDateTimeBR(match.matchDateUtc)}</p>
                  <p className="mt-1 font-semibold">
                    {match.homeTeam} x {match.awayTeam}
                  </p>
                </Link>
              ))}
              {nextMatches.length === 0 ? <p className="text-sm text-steel">Nenhum jogo aberto no momento.</p> : null}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function WhatsAppGroupInvite() {
  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-emerald-300/20 bg-[#08140d] shadow-sm">
      <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center md:p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#25D366] text-ink shadow-glow">
            <MessageCircle size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Entre no grupo do Copolão</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-steel">
              Use a camera do WhatsApp para escanear o QR code e entrar no grupo oficial. É por lá que vamos avisar sobre prazos, resultados lançados e recados importantes do bolão.
            </p>
            <a
              className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-[#25D366] px-4 text-sm font-black text-ink transition hover:brightness-110"
              href={WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noreferrer"
            >
              Entrar no grupo
            </a>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[220px] rounded-lg bg-white p-3 md:w-[180px]">
          <img className="h-auto w-full rounded-md" src={whatsappGroupQr} alt="QR code do grupo do Copolão no WhatsApp" />
        </div>
      </div>
    </section>
  );
}

function FirstAccessRoadmap({
  matchCount,
  sentPredictions,
  groupCount,
  sentGroupStandings,
  bonusQuestionCount,
  sentBonusQuestions
}: {
  matchCount: number;
  sentPredictions: number;
  groupCount: number;
  sentGroupStandings: number;
  bonusQuestionCount: number;
  sentBonusQuestions: number;
}) {
  const pendingMatchPredictions = Math.max(matchCount - sentPredictions, 0);
  const pendingGroupStandings = Math.max(groupCount - sentGroupStandings, 0);
  const pendingBonusQuestions = Math.max(bonusQuestionCount - sentBonusQuestions, 0);

  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-limebet/20 bg-felt text-white shadow-sm">
      <div className="border-b border-white/10 bg-limebet/[0.06] px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-limebet text-ink">
            <BookOpenCheck size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black">Primeiro acesso</h2>
            <p className="mt-1 text-sm leading-6 text-steel">
              Comece pelos jogos da fase de grupos, depois faça os bônus. Tudo pode ser alterado até o fechamento.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-3">
        <RoadmapMetric
          icon={Trophy}
          label="Jogos dos grupos"
          value={`${sentPredictions}/${matchCount}`}
          detail={`${pendingMatchPredictions} palpites de placar pendentes`}
          to="/jogos?aba=grupos"
        />
        <RoadmapMetric
          icon={ListOrdered}
          label="Classificação dos grupos"
          value={`${sentGroupStandings}/${groupCount}`}
          detail="1 ponto por posição correta, +1 se fechar o grupo perfeito"
          to="/jogos?aba=bonus"
        />
        <RoadmapMetric
          icon={Gift}
          label="Bônus especiais"
          value={`${sentBonusQuestions}/${bonusQuestionCount}`}
          detail={`${pendingBonusQuestions} perguntas especiais pendentes`}
          to="/jogos?aba=bonus"
        />
      </div>

      <div className="grid gap-3 border-t border-white/10 p-4 md:grid-cols-3">
        <RoadmapStep icon={Trophy} title="1. Palpite os placares" text="Em Jogos, escolha o placar de cada partida da fase de grupos." />
        <RoadmapStep icon={Gift} title="2. Faça os bônus" text="Na aba Bônus, responda perguntas especiais e monte a ordem final dos grupos." />
        <RoadmapStep icon={Eye} title="3. Acompanhe a disputa" text="Depois que o jogo começar, os palpites dos outros participantes ficam visíveis." />
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-steel">
          <Medal size={17} className="text-limebet" />
          O ranking soma placares, resultados certos e bônus apurados pelo admin.
        </div>
        <Link className="inline-flex h-11 items-center justify-center rounded-lg bg-limebet px-4 text-sm font-black text-ink" to="/jogos">
          Começar palpites
        </Link>
      </div>
    </section>
  );
}

function RoadmapMetric({
  icon: Icon,
  label,
  value,
  detail,
  to
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  detail: string;
  to: string;
}) {
  return (
    <Link className="rounded-lg border border-white/10 bg-ink p-3 transition hover:border-limebet/45" to={to}>
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-limebet/10 text-limebet">
          <Icon size={18} />
        </div>
        <strong className="text-lg text-limebet">{value}</strong>
      </div>
      <p className="mt-3 text-sm font-black">{label}</p>
      <p className="mt-1 text-xs leading-5 text-steel">{detail}</p>
    </Link>
  );
}

function RoadmapStep({
  icon: Icon,
  title,
  text
}: {
  icon: typeof Trophy;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg bg-ink p-3">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={17} className="text-limebet" />
        <h3 className="text-sm font-black">{title}</h3>
      </div>
      <p className="text-xs leading-5 text-steel">{text}</p>
    </div>
  );
}
