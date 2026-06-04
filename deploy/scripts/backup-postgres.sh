#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-./backups}"
ENV_FILE="${ENV_FILE:-deploy/.env.production}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

if [ ! -f "$ENV_FILE" ]; then
  echo "Arquivo de ambiente nao encontrado: $ENV_FILE" >&2
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

mkdir -p "$BACKUP_DIR"

docker compose \
  --env-file deploy/.env.production \
  -f deploy/docker-compose.prod.yml \
  exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  > "$BACKUP_DIR/copolao-$TIMESTAMP.sql"

find "$BACKUP_DIR" -type f -name "copolao-*.sql" -mtime +14 -delete

echo "Backup criado em $BACKUP_DIR/copolao-$TIMESTAMP.sql"
