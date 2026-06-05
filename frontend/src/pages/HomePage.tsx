import { Link, Navigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, Banknote, CalendarClock, CircleDollarSign, ShieldCheck, Trophy, UsersRound } from "lucide-react";
import { useAuth } from "../api/auth";
import copolaoLogo from "../assets/copolao-logo-transparent.png";

const prizes = [
  { place: "1o lugar", value: "R$ 300" },
  { place: "2o lugar", value: "R$ 125" },
  { place: "3o lugar", value: "R$ 75" }
];

const highlights = [
  { icon: CircleDollarSign, label: "Inscrição", value: "R$ 20" },
  { icon: UsersRound, label: "Participantes", value: "30 vagas" },
  { icon: Banknote, label: "Premiação", value: "R$ 500" }
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
              Palpite, acompanhe e dispute a premiação do Copolão.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-steel md:text-lg">
              Entrada por Pix, ranking automático e palpites fechando 30 minutos antes de cada jogo.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-limebet px-5 text-sm font-black text-ink shadow-glow" to="/cadastro">
                Participar por R$ 20
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
                  <p className="text-xs font-bold uppercase text-steel">Premiação prevista</p>
                  <p className="mt-1 text-3xl font-black text-limebet">R$ 500</p>
                </div>
                <img className="h-20 w-20 object-contain" src={copolaoLogo} alt="" />
              </div>
              <div className="mt-4 space-y-2">
                {prizes.map((prize) => (
                  <div key={prize.place} className="flex items-center justify-between rounded-lg border border-white/10 bg-felt px-3 py-3">
                    <span className="text-sm font-bold">{prize.place}</span>
                    <strong className="text-lg text-limebet">{prize.value}</strong>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-steel">
                Valores considerando 30 participantes e reserva operacional de R$ 100.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-3">
        <InfoBlock icon={CalendarClock} title="Palpites até perto do jogo" text="Cada partida fecha 30 minutos antes do início." />
        <InfoBlock icon={BadgeCheck} title="Bônus de grupo" text="Monte a ordem final de cada grupo e some pontos extras." />
        <InfoBlock icon={ShieldCheck} title="Disputa transparente" text="Ranking com todos os participantes e pontuação automática." />
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
