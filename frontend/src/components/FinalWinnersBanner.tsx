import { Crown, Medal, Sparkles, Trophy } from "lucide-react";
import clsx from "clsx";
import type { RankingEntry } from "../types/domain";
import { UserAvatar } from "./UserAvatar";

export function FinalWinnersBanner({ ranking, compact = false }: { ranking: RankingEntry[]; compact?: boolean }) {
  const podium = ranking.slice(0, 3);
  const champion = podium[0];
  const runnersUp = podium.slice(1);

  if (!champion) return null;

  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-limebet/25 bg-[#050805] text-white shadow-glow">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(250,204,21,0.22),transparent_28%),radial-gradient(circle_at_88%_16%,rgba(33,247,102,0.2),transparent_30%),linear-gradient(135deg,rgba(33,247,102,0.12),transparent_48%)]" />
        <div className={clsx("relative grid gap-4 p-4 md:p-6", compact ? "lg:grid-cols-[1fr_1.2fr]" : "lg:grid-cols-[1.1fr_1.4fr]")}>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase text-amber-200">
              <Sparkles size={14} />
              Copolão encerrado
            </div>
            <h2 className="mt-4 text-3xl font-black leading-tight md:text-5xl">Pódio final do Copolão 2026</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-steel">
              A Copa acabou, os bônus foram apurados e o ranking final está definido. Parabéns aos vencedores.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-lg border border-amber-300/35 bg-[linear-gradient(145deg,rgba(250,204,21,0.16),rgba(18,19,24,0.92)_48%)] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    avatarUrl={champion.user.avatarUrl}
                    name={champion.user.nickname || champion.user.name}
                    size="xl"
                    className="bg-amber-300 text-ink"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-amber-200">Campeão</p>
                    <h3 className="mt-1 truncate text-2xl font-black">{champion.user.nickname || champion.user.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-steel">{champion.totalPoints} pontos</p>
                  </div>
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-amber-300 text-ink">
                  <Crown size={25} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <WinnerMetric label="Jogos" value={champion.matchPoints} />
                <WinnerMetric label="Bônus" value={champion.bonusPoints} />
                <WinnerMetric label="Exatos" value={champion.exactScores} />
              </div>
            </article>

            <div className="grid gap-3">
              {runnersUp.map((entry) => (
                <PodiumMiniCard key={entry.user.id} entry={entry} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PodiumMiniCard({ entry }: { entry: RankingEntry }) {
  const isSecond = entry.position === 2;

  return (
    <article
      className={clsx(
        "rounded-lg border p-3",
        isSecond ? "border-sky-300/30 bg-sky-300/[0.08]" : "border-limebet/25 bg-limebet/[0.06]"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar
            avatarUrl={entry.user.avatarUrl}
            name={entry.user.nickname || entry.user.name}
            size="lg"
            className={isSecond ? "bg-sky-300 text-ink" : "bg-limebet text-ink"}
          />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-steel">{entry.position}º lugar</p>
            <h3 className="truncate text-base font-black">{entry.user.nickname || entry.user.name}</h3>
            <p className="text-xs font-semibold text-steel">{entry.totalPoints} pontos</p>
          </div>
        </div>
        <div className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-lg text-ink", isSecond ? "bg-sky-300" : "bg-limebet")}>
          {isSecond ? <Medal size={20} /> : <Trophy size={20} />}
        </div>
      </div>
    </article>
  );
}

function WinnerMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-ink/70 px-2 py-2">
      <p className="text-lg font-black text-amber-200">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase text-steel">{label}</p>
    </div>
  );
}
