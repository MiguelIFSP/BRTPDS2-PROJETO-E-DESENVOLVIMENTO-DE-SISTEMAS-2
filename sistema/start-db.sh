#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="better-meet/docker-compose.yml"
SERVICE="db_better_meet"

if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DC=(docker-compose)
else
  echo "Error: neither 'docker compose' nor 'docker-compose' was found. Install Docker." >&2
  exit 1
fi

usage() {
  cat <<-USAGE
Usage: $0 {up|down|status|help}

Commands:
  up      Start the DB container in background
  down    Stop and remove containers created by compose
  status  Show running container status
  help    Show this message
USAGE
}

cmd="${1:-help}"
case "$cmd" in
  up)
    "${DC[@]}" -f "$COMPOSE_FILE" up -d $SERVICE
    ;;
  down)
    "${DC[@]}" -f "$COMPOSE_FILE" down
    ;;
  status)
    docker ps --filter "name=mysql_better_meet" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    ;;
  help|*)
    usage
    ;;
esac
