#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

docker compose \
  --env-file deploy/.env.production \
  -f deploy/docker-compose.prod.yml \
  exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  > "$BACKUP_DIR/copolao-$TIMESTAMP.sql"

find "$BACKUP_DIR" -type f -name "copolao-*.sql" -mtime +14 -delete

echo "Backup criado em $BACKUP_DIR/copolao-$TIMESTAMP.sql"
