import { Link, Navigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, CalendarClock, ClipboardList, ListOrdered, ShieldCheck, Target, Trophy, UsersRound } from "lucide-react";
import { useAuth } from "../api/auth";
import copolaoLogo from "../assets/copolao-logo-transparent.png";

const steps = [
  { title: "1. Peça seu código", text: "Faça o Pix com o organizador e receba um código individual de acesso." },
  { title: "2. Faça seus palpites", text: "Palpite os placares dos jogos e responda os bônus antes do fechamento." },
  { title: "3. Acompanhe o ranking", text: "Depois dos resultados, a pontuação é somada e todos aparecem na tabela." }
];

const highlights = [
  { icon: ClipboardList, label: "Jogos", value: "72 placares" },
  { icon: ListOrdered, label: "Grupos", value: "12 ordens" },
  { icon: Trophy, label: "Bônus", value: "4 especiais" }
];

const scoringRules = [
  { title: "Grupos: placar exato", value: "3 pts", text: "Acertou exatamente o resultado do jogo na fase de grupos." },
  { title: "Grupos: resultado certo", value: "1 pt", text: "Acertou vencedor ou empate na fase de grupos, mas errou o placar." },
  { title: "Mata-mata", value: "2–8 pts", text: "O valor do resultado correto aumenta a cada fase. Placar exato soma +3." },
  { title: "Ordem do grupo", value: "1 pt", text: "Cada posição correta na classificação final vale ponto." },
  { title: "Grupo perfeito", value: "+1 pt", text: "Acertou as quatro posições do mesmo grupo." },
  { title: "Bônus especiais", value: "até 20 pts", text: "Campeão, vice, artilheiro e melhor ataque." },
  { title: "Fechamento", value: "30 min", text: "Palpites fecham antes do início de cada jogo." }
];

export function HomePage() {
  const { token, user } = useAuth();

  if (token && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="min-h-screen bg-ink text-white">
      <header className="border-b border-white/10 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link className="flex items-center gap-3" to="/">
            <img className="h-14 w-14 object-contain" src={copolaoLogo} alt="Copolão" />
            <div>
              <p className="text-base font-black uppercase leading-5">Copolão</p>
              <p className="text-xs font-semibold text-steel">Copa, amigos e palpites</p>
            </div>
          </Link>
          <Link className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 px-4 text-sm font-bold text-white transition hover:border-limebet/60" to="/login">
            Entrar
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1fr_390px] md:items-center md:py-14">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-limebet/25 bg-limebet/10 px-3 py-2 text-xs font-black uppercase text-limebet">
              <Trophy size={16} />
              Bolão privado da Copa
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
              Palpite nos jogos da Copa e acompanhe tudo em um ranking só.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-steel md:text-lg">
              Depois de receber seu código de acesso, você palpita nos placares da fase de grupos, monta a ordem final dos grupos e responde bônus especiais.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-limebet px-5 text-sm font-black text-ink shadow-glow" to="/cadastro">
                Tenho meu código
                <ArrowRight size={18} />
              </Link>
              <Link className="inline-flex h-12 items-center justify-center rounded-lg border border-white/10 px-5 text-sm font-bold text-white transition hover:border-limebet/60" to="/login">
                Já tenho conta
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-2">
              {highlights.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-lg border border-white/10 bg-felt p-3">
                  <Icon className="text-limebet" size={18} />
                  <p className="mt-2 text-[11px] font-semibold uppercase text-steel">{label}</p>
                  <p className="mt-1 text-base font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-limebet/20 bg-felt p-4 shadow-glow">
            <div className="rounded-lg bg-ink p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-steel">Como funciona</p>
                  <p className="mt-1 text-3xl font-black text-limebet">3 passos</p>
                </div>
                <img className="h-20 w-20 object-contain" src={copolaoLogo} alt="" />
              </div>
              <div className="mt-4 space-y-3">
                {steps.map((step) => (
                  <div key={step.title} className="rounded-lg border border-white/10 bg-felt px-3 py-3">
                    <p className="text-sm font-black">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-steel">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-3">
        <InfoBlock icon={CalendarClock} title="Palpites até perto do jogo" text="Cada partida fecha 30 minutos antes do início." />
        <InfoBlock icon={BadgeCheck} title="Bônus de grupo" text="Monte a ordem final de cada grupo e some pontos extras." />
        <InfoBlock icon={ShieldCheck} title="Entrada por código" text="O acesso é liberado com um código individual enviado pelo organizador." />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="mb-4 flex items-center gap-2">
          <Target className="text-limebet" size={22} />
          <h2 className="text-2xl font-black">Pontuação</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {scoringRules.map((rule) => (
            <article key={rule.title} className="rounded-lg border border-white/10 bg-felt p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-black">{rule.title}</h3>
                <strong className="shrink-0 rounded-lg bg-limebet px-2 py-1 text-sm font-black text-ink">{rule.value}</strong>
              </div>
              <p className="mt-3 text-sm leading-6 text-steel">{rule.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function InfoBlock({
  icon: Icon,
  title,
  text
}: {
  icon: typeof CalendarClock;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-felt p-4">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-limebet text-ink">
        <Icon size={21} />
      </div>
      <h2 className="mt-4 text-lg font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-steel">{text}</p>
    </article>
  );
}
