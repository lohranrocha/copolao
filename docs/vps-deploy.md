# Deploy em VPS

Este e o caminho recomendado para o Copolao em producao:

- 1 VPS Ubuntu.
- Docker e Docker Compose.
- Caddy para HTTPS automatico.
- Postgres no proprio servidor.
- Backend Node/Fastify.
- Frontend React estatico.

## 1. Dados Que Precisamos

Antes de configurar, tenha em maos:

```text
IP do servidor:
Dominio raiz: exemplo.com.br
Dominio principal do app: www.exemplo.com.br
Subdominio da API: api.exemplo.com.br
E-mail para SSL: seu-email@exemplo.com.br
Usuario SSH: root ou outro usuario sudo
```

## 2. DNS

No painel do dominio ou no Cloudflare, crie dois registros `A`:

```text
@    A    IP_DO_SERVIDOR
www  A    IP_DO_SERVIDOR
api  A    IP_DO_SERVIDOR
```

Se o dominio for `copolao.com.br`, ficara:

```text
copolao.com.br      -> IP_DO_SERVIDOR
www.copolao.com.br  -> IP_DO_SERVIDOR
api.copolao.com.br  -> IP_DO_SERVIDOR
```

Aguarde a propagacao. Normalmente leva alguns minutos, mas pode levar mais.

## 3. Acessar o Servidor

No seu computador:

```bash
ssh root@IP_DO_SERVIDOR
```

Atualize o servidor:

```bash
apt update && apt upgrade -y
```

Instale Docker:

```bash
curl -fsSL https://get.docker.com | sh
```

Confirme:

```bash
docker --version
docker compose version
```

## 4. Baixar o Projeto

No servidor:

```bash
mkdir -p /opt
cd /opt
git clone https://github.com/lohranrocha/copolao.git
cd copolao
```

Se o repositorio for privado, use o metodo de clone autorizado pelo GitHub.

## 5. Criar Variaveis de Producao

Copie o exemplo:

```bash
cp deploy/.env.production.example deploy/.env.production
```

Edite:

```bash
nano deploy/.env.production
```

Preencha algo assim:

```text
ROOT_DOMAIN=copolao.com.br
APP_DOMAIN=www.copolao.com.br
API_DOMAIN=api.copolao.com.br
ACME_EMAIL=seu-email@dominio.com

POSTGRES_USER=copolao
POSTGRES_PASSWORD=uma-senha-grande-e-segura
POSTGRES_DB=copolao

JWT_SECRET=um-segredo-grande-com-mais-de-32-caracteres

PAYMENT_PROVIDER=mock
REGISTRATION_PRICE_CENTS=2000
ASAAS_API_URL=https://api-sandbox.asaas.com/v3
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
```

As variaveis de pagamento ficam em modo `mock` por compatibilidade com codigo legado, mas o fluxo principal de entrada e manual: o participante paga o Pix para o organizador, recebe um codigo e usa esse codigo no cadastro.

## 6. Subir a Aplicacao

No servidor, dentro de `/opt/copolao`:

```bash
docker compose --env-file deploy/.env.production -f deploy/docker-compose.prod.yml up -d --build
```

Ver logs:

```bash
docker compose --env-file deploy/.env.production -f deploy/docker-compose.prod.yml logs -f
```

Testar API:

```bash
curl https://api.copolao.com.br/api/health
```

Deve responder:

```json
{"ok":true}
```

## 7. Rodar Seed Inicial

Depois que os containers estiverem de pe:

```bash
docker compose --env-file deploy/.env.production -f deploy/docker-compose.prod.yml exec api npm run prisma:seed --workspace backend
```

Isso cria:

- admin inicial;
- jogos da fase de grupos;
- perguntas bonus.

Admin inicial:

```text
E-mail: admin@bolao.local
Senha: Admin@2026
```

Troque a senha depois pelo banco ou por uma funcionalidade futura de perfil/senha.

Para liberar participantes, acesse o painel admin em `/admin`, crie um codigo de convite e envie para a pessoa depois de conferir o Pix. Para um codigo individual, use limite `1`.

## 8. Atualizar Depois de Mudancas

Quando houver novo codigo no GitHub:

```bash
cd /opt/copolao
git pull
docker compose --env-file deploy/.env.production -f deploy/docker-compose.prod.yml up -d --build
```

As migrations rodam automaticamente quando a API inicia.

## 9. Backup

Rodar backup manual:

```bash
sh deploy/scripts/backup-postgres.sh
```

Isso cria arquivos em `./backups` e remove backups com mais de 14 dias.

Para automatizar diariamente as 03:00:

```bash
crontab -e
```

Adicione:

```text
0 3 * * * cd /opt/copolao && sh deploy/scripts/backup-postgres.sh >> /var/log/copolao-backup.log 2>&1
```

## 10. Portas Necessarias

No firewall do provedor, libere:

```text
22   SSH
80   HTTP
443  HTTPS
```

Nao exponha a porta do Postgres publicamente.
