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

## Entrada por Pix manual e código

O fluxo atual e simples:

- A pessoa faz o Pix diretamente para o organizador.
- O admin cria um codigo no painel `/admin`.
- A pessoa usa esse codigo em `/cadastro`.
- Para liberar uma unica pessoa, crie o codigo com limite de uso `1`.

Nao mantenha codigos de acesso fixos no repositorio. Eles devem ser criados pelo painel admin ou diretamente no banco de producao.

## Deploy

O caminho recomendado para producao e VPS com Docker, Caddy e Postgres local. Veja [`docs/vps-deploy.md`](docs/vps-deploy.md).

Tambem existe um guia alternativo para Render/Supabase em [`docs/deploy.md`](docs/deploy.md).

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
