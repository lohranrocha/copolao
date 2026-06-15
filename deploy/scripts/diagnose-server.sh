#!/usr/bin/env sh
set -eu

ENV_FILE="${ENV_FILE:-deploy/.env.production}"
COMPOSE="docker compose --env-file $ENV_FILE -f deploy/docker-compose.prod.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Arquivo de ambiente nao encontrado: $ENV_FILE" >&2
  exit 1
fi

section() {
  printf "\n\n===== %s =====\n" "$1"
}

section "Data e uptime"
date
uptime || true

section "Disco"
df -h || true

section "Memoria"
free -m || true

section "Containers"
$COMPOSE ps || true

section "Restart count"
$COMPOSE ps -q | while read -r container_id; do
  [ -n "$container_id" ] || continue
  docker inspect \
    --format '{{.Name}} restart={{.RestartCount}} status={{.State.Status}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}} oom={{.State.OOMKilled}} exit={{.State.ExitCode}}' \
    "$container_id" || true
done

section "Docker stats"
docker stats --no-stream || true

section "API health interno"
$COMPOSE exec -T api node -e "fetch('http://127.0.0.1:3333/api/health').then(async r=>{console.log(r.status, await r.text())}).catch(e=>{console.error(e); process.exit(1)})" || true

section "Logs API"
$COMPOSE logs --tail=160 api || true

section "Logs Web/Caddy"
$COMPOSE logs --tail=120 web || true

section "Logs Postgres"
$COMPOSE logs --tail=80 postgres || true

section "Kernel OOM"
dmesg -T 2>/dev/null | grep -iE "killed process|out of memory|oom" | tail -40 || true
