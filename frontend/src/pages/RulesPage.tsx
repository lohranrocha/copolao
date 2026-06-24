import { PageHeader } from "../components/PageHeader";

export function RulesPage() {
  return (
    <section>
      <PageHeader title="Regras" description="Resumo simples do funcionamento do bolao." />
      <div className="space-y-3 rounded-lg border border-white/10 bg-felt p-5 text-sm leading-6 text-white/80 shadow-sm">
        <p>Cada participante pode enviar um palpite por jogo.</p>
        <p>O palpite pode ser alterado ate 30 minutos antes do inicio da partida.</p>
        <p>Placar exato vale 3 pontos. Resultado certo vale 1 ponto. Resultado errado vale 0 pontos.</p>
        <p>No mata-mata, o placar considerado e o resultado ao fim dos 90 minutos.</p>
        <p>Resultado correto vale 2 pontos nos 16 avos e oitavas, 4 nas quartas, 5 nas semifinais e terceiro lugar, e 8 na final.</p>
        <p>Acertar o placar exato no mata-mata soma mais 3 pontos ao valor da fase.</p>
        <p>Em um palpite de empate, tambem sera necessario escolher quem avanca, sem pontuacao adicional separada.</p>
        <p>Na classificacao dos grupos, cada posicao correta vale 1 ponto. Se acertar as quatro posicoes de um grupo, ganha +1 ponto extra.</p>
        <p>Os bonus especiais entram no ranking quando o administrador lancar a resposta correta.</p>
        <p>Os palpites dos outros participantes ficam escondidos ate o jogo comecar.</p>
        <p>O ranking mostra todos os participantes do bolao.</p>
      </div>
    </section>
  );
}
