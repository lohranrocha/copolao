# Bolao Copa

Aplicacao web responsiva para um bolao privado da Copa. O produto e recreativo: nao possui odds, carteira, saques, depositos, banca ou apostas avulsas.

## Stack

- Backend: Node.js, TypeScript, Fastify, Prisma, PostgreSQL, JWT.
- Frontend: React, TypeScript, Vite, Tailwind CSS.
- Banco local: Docker Compose com PostgreSQL.

## Rodando localmente

1. Instale as dependencias:

```bash
npm install
```

2. Suba o banco. O PostgreSQL local do app usa a porta `55432` para evitar conflito com outro Postgres na maquina:

```bash
docker compose up -d
```

3. Configure o backend:

```bash
cp backend/.env.example backend/.env
```

4. Rode migrations e seed:

```bash
npm run prisma:migrate --workspace backend
npm run prisma:seed --workspace backend
```

Esse seed cria exatamente a base inicial atual:

- 1 usuario administrador.
- 72 jogos da fase de grupos.
- 0 palpites.

Assim, qualquer pessoa que clonar o repositorio e rodar esses comandos vera a mesma estrutura inicial do app.

5. Inicie backend e frontend em terminais separados:

```bash
npm run dev:backend
npm run dev:frontend
```

## Acessos iniciais

- Admin: `admin@bolao.local`
- Senha: `Admin@2026`

Troque esses valores no primeiro deploy real.

## Pagamento Pix com Asaas

O cadastro novo ja nasce preparado para cobrar a inscricao de R$ 20 via Pix antes de liberar o acesso.

Cadastro por convite esta desativado. Participantes entram somente pelo pagamento Pix.

## Deploy

O caminho recomendado para producao e VPS com Docker, Caddy e Postgres local. Veja [`docs/vps-deploy.md`](docs/vps-deploy.md).

Tambem existe um guia alternativo para Render/Supabase em [`docs/deploy.md`](docs/deploy.md).

Em desenvolvimento, o backend usa `PAYMENT_PROVIDER="mock"`. Nesse modo, a tela de pagamento mostra um Pix simulado e um botao para aprovar o pagamento sem chamar o Asaas.

Para sandbox ou producao com Asaas, configure no backend:

```bash
PAYMENT_PROVIDER="asaas"
REGISTRATION_PRICE_CENTS=2000
PUBLIC_API_URL="https://seu-backend-publico.com"
ASAAS_API_URL="https://api-sandbox.asaas.com/v3"
ASAAS_API_KEY="$aact_hmlg_..."
ASAAS_WEBHOOK_TOKEN="token-seguro-configurado-no-webhook"
```

Em producao, troque `ASAAS_API_URL` para:

```bash
ASAAS_API_URL="https://api.asaas.com/v3"
```

Depois, no painel do Asaas, cadastre o webhook de cobrancas apontando para:

```text
https://seu-backend-publico.com/api/webhooks/asaas
```

Selecione pelo menos o evento `PAYMENT_RECEIVED`. O token configurado no painel do Asaas deve ser o mesmo valor de `ASAAS_WEBHOOK_TOKEN`.

Quando o Asaas confirmar o Pix, o backend marca o pagamento como pago, cria um codigo de acesso unico para auditoria e cadastra o participante automaticamente.

## Compartilhando com outro desenvolvedor

O banco local nao deve ser versionado no GitHub. A forma correta de compartilhar o estado inicial e manter no repositorio:

- migrations do Prisma;
- `backend/prisma/seed.ts`;
- `docker-compose.yml`;
- `.env.example`.

Depois de clonar, a outra pessoa roda:

```bash
npm install
cp backend/.env.example backend/.env
docker compose up -d
npm run prisma:migrate --workspace backend
npm run prisma:seed --workspace backend
npm run dev:backend
npm run dev:frontend
```

Para compartilhar um banco online de verdade entre voces, use um Postgres hospedado barato/gratuito como Neon, Supabase, Render ou Railway, configure `DATABASE_URL` no backend e rode as mesmas migrations e seed nesse banco remoto.

## Regras principais

- Palpites fecham 30 minutos antes do inicio do jogo.
- Cada participante tem no maximo 1 palpite por jogo.
- Placar exato vale 3 pontos.
- Resultado correto vale 1 ponto.
- Resultado errado vale 0 pontos.
- Participantes nao veem palpites de outros usuarios antes do inicio da partida.
- Jogos nao sao editaveis pela aplicacao.

## Fontes do seed da Copa

O seed inicial dos grupos e confrontos foi montado a partir da pagina oficial de calendario da FIFA e conferido contra a listagem de fixtures da FourFourTwo publicada em 8 de abril de 2026.
