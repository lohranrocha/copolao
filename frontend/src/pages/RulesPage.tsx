import { PageHeader } from "../components/PageHeader";

export function RulesPage() {
  return (
    <section>
      <PageHeader title="Regras" description="Resumo simples do funcionamento do bolao." />
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-700 shadow-sm">
        <p>Cada participante pode enviar um palpite por jogo.</p>
        <p>O palpite pode ser alterado ate uma hora antes do inicio da partida.</p>
        <p>Placar exato vale 3 pontos. Resultado certo vale 1 ponto. Resultado errado vale 0 pontos.</p>
        <p>Os palpites dos outros participantes ficam escondidos ate o jogo comecar.</p>
        <p>O ranking mostra todos os participantes do bolao.</p>
      </div>
    </section>
  );
}
