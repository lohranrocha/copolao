import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { api } from "../api/client";
import type { Match, Prediction } from "../types/domain";
import { formatDateTimeBR } from "../utils/date";

type PredictionWithMatch = Prediction & {
  match: Match;
};

export function MyPredictionsPage() {
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([]);

  useEffect(() => {
    void api.get<{ predictions: PredictionWithMatch[] }>("/predictions/me").then(({ data }) => {
      setPredictions(data.predictions);
    });
  }, []);

  return (
    <section>
      <PageHeader title="Meus palpites" description="Historico dos seus palpites enviados." />
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
        {predictions.length === 0 ? <p className="rounded-lg border border-white/10 bg-felt p-4 text-sm text-steel">Voce ainda nao enviou palpites.</p> : null}
      </div>
    </section>
  );
}
