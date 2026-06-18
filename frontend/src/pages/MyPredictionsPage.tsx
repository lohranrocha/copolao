import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { api, getApiError } from "../api/client";
import type { Match, Prediction } from "../types/domain";
import { formatDateTimeBR } from "../utils/date";

type PredictionWithMatch = Prediction & {
  match: Match;
};

export function MyPredictionsPage() {
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadPredictions(showRefreshState = false) {
    if (showRefreshState) setRefreshing(true);

    try {
      const { data } = await api.get<{ predictions: PredictionWithMatch[] }>("/predictions/me", {
        params: { updatedAt: Date.now() }
      });
      setPredictions(data.predictions);
      setError("");
    } catch (loadError) {
      setError(getApiError(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadPredictions();

    const refresh = () => void loadPredictions();
    window.addEventListener("focus", refresh);
    window.addEventListener("copolao:prediction-updated", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("copolao:prediction-updated", refresh);
    };
  }, []);

  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Meus palpites" description="Historico dos seus palpites enviados." />
        <button
          className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-felt text-steel transition hover:border-limebet/45 hover:text-limebet disabled:opacity-50"
          disabled={refreshing}
          title="Atualizar palpites"
          type="button"
          onClick={() => void loadPredictions(true)}
        >
          <RefreshCw className={refreshing ? "animate-spin" : ""} size={17} />
        </button>
      </div>
      {error ? <p className="mb-4 rounded-lg border border-rose-300/25 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200">{error}</p> : null}
      <div className="space-y-3">
        {predictions.map((prediction) => (
          <article key={prediction.id} className="rounded-lg border border-white/10 bg-felt p-4 text-white shadow-sm">
            <p className="text-xs font-medium uppercase text-steel">
              Grupo {prediction.match.groupCode} · {formatDateTimeBR(prediction.match.matchDateUtc)}
            </p>
            <h2 className="mt-2 font-bold">
              {prediction.match.homeTeam} {prediction.homeScorePrediction} x {prediction.awayScorePrediction} {prediction.match.awayTeam}
            </h2>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-ink px-3 py-2 text-sm">
              <span>{prediction.match.homeScore !== null ? `Resultado: ${prediction.match.homeScore} x ${prediction.match.awayScore}` : "Resultado pendente"}</span>
              <strong className="text-limebet">{prediction.points} pts</strong>
            </div>
          </article>
        ))}
        {!loading && predictions.length === 0 ? <p className="rounded-lg border border-white/10 bg-felt p-4 text-sm text-steel">Voce ainda nao enviou palpites.</p> : null}
      </div>
    </section>
  );
}
