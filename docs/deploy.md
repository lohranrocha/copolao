# Deploy do Copolao

Este guia usa um caminho simples e barato:

- Banco Postgres: Supabase.
- Backend Node/Fastify: Render Web Service.
- Frontend React/Vite: Render Static Site.

O objetivo e obter duas URLs publicas:

- Frontend: `https://copolao-web.onrender.com`
- Backend: `https://copolao-api.onrender.com`

Com a URL publica do backend, o webhook do Asaas sera:

```text
https://copolao-api.onrender.com/api/webhooks/asaas
```

## 1. Criar o banco no Supabase

1. Crie um projeto em `https://supabase.com`.
2. Entre em Project Settings > Database.
3. Copie a connection string de Postgres.
4. Use a URL de connection pooling se estiver disponivel.
5. Guarde essa URL para preencher `DATABASE_URL` no Render.

## 2. Subir no GitHub

Suba o repositorio com estes arquivos:

- `render.yaml`
- `backend/prisma/migrations`
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`
- todo o backend e frontend.

Nao suba arquivos `.env`.

## 3. Criar os servicos no Render

1. Acesse `https://dashboard.render.com`.
2. Clique em New > Blueprint.
3. Conecte o repositorio do GitHub.
4. Selecione o arquivo `render.yaml`.
5. O Render criara:
   - `copolao-api`
   - `copolao-web`

Durante a criacao, preencha as variaveis marcadas como secret/sync false.

## 4. Variaveis do backend

No servico `copolao-api`, configure:

```text
DATABASE_URL=<connection string do Supabase>
WEB_ORIGIN=https://copolao-web.onrender.com
PUBLIC_API_URL=https://copolao-api.onrender.com
PAYMENT_PROVIDER=mock
REGISTRATION_PRICE_CENTS=2000
ASAAS_API_URL=https://api-sandbox.asaas.com/v3
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
```

Para producao com Asaas:

```text
PAYMENT_PROVIDER=asaas
ASAAS_API_URL=https://api.asaas.com/v3
ASAAS_API_KEY=<sua API key de producao>
ASAAS_WEBHOOK_TOKEN=<token configurado no webhook do Asaas>
```

O `JWT_SECRET` pode ser gerado automaticamente pelo Render via `render.yaml`.

## 5. Variaveis do frontend

No servico `copolao-web`, configure:

```text
VITE_API_URL=https://copolao-api.onrender.com/api
```

Depois de alterar `VITE_API_URL`, faca redeploy do frontend, porque variaveis `VITE_` entram no build.

## 6. Rodar seed em producao

Depois do primeiro deploy do backend:

1. Abra o servico `copolao-api` no Render.
2. Abra Shell.
3. Rode:

```bash
npm run prisma:seed --workspace backend
```

Isso cria:

- admin inicial;
- jogos da fase de grupos;
- perguntas bonus.

## 7. Testar

Teste as URLs:

```text
https://copolao-api.onrender.com/api/health
https://copolao-web.onrender.com
```

Depois tente:

1. Abrir o frontend.
2. Criar conta.
3. Gerar Pix em modo `mock`.
4. Simular pagamento.
5. Entrar no app.

## 8. Configurar Asaas

Quando o backend estiver publico e testado:

1. Entre no painel web do Asaas.
2. Va em Integracoes > Webhooks.
3. Crie webhook de cobrancas.
4. URL:

```text
https://copolao-api.onrender.com/api/webhooks/asaas
```

5. Evento minimo:

```text
PAYMENT_RECEIVED
```

6. Configure um token seguro.
7. Copie esse token para `ASAAS_WEBHOOK_TOKEN` no Render.
8. Troque `PAYMENT_PROVIDER` para `asaas`.
9. Redeploy do backend.

## Observacao sobre custo e estabilidade

O Render Free e bom para validar o deploy, mas web services gratuitos podem dormir apos inatividade. Para pagamento online com webhook, o ideal e usar um plano sempre ligado no backend antes de abrir o bolao para todo mundo.
