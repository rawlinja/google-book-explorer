#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WATCH_PORT=3005
WATCH_LOG_FILE="$ROOT_DIR/scripts/logs/frontend-watch.log"

usage() {
  cat <<'EOF'
Usage: bash scripts/dev.sh <command>

Commands:
  up [--build]  Start containers and the frontend watch in the background; --build rebuilds images first
  down          Stop the frontend watch and containers
  status        Show health checks, frontend watch state, and container status
  logs [svc]    Follow container logs, optionally for one service (api, nginx, redis)
EOF
}

check_env() {
  if [ ! -f "$ROOT_DIR/.env" ]; then
    echo "Error: .env file not found. Run: cp .env.example .env"
    exit 1
  fi
}

dc() {
  docker compose -f "$ROOT_DIR/docker-compose.yml" -f "$ROOT_DIR/docker-compose.dev.yml" "$@"
}

watch_pid() {
  local pid
  pid=$(lsof -ti:"$WATCH_PORT" -sTCP:LISTEN 2>/dev/null | head -1) || true
  [[ -n "$pid" ]] || return 1
  echo "$pid"
}

start_watch() {
  local pid
  if pid=$(watch_pid); then
    echo "Frontend watch already running (PID $pid)"
    return
  fi

  # Job control gives the watch its own process group, so down can stop pnpm and its node child together.
  mkdir -p "$(dirname "$WATCH_LOG_FILE")"
  set -m
  (cd "$ROOT_DIR/frontend" && exec pnpm watch) >"$WATCH_LOG_FILE" 2>&1 &
  set +m
  echo "Frontend watch started (PID $!, log: scripts/logs/frontend-watch.log)"
}

stop_watch() {
  local pid pgid
  pid=$(watch_pid) || return 0
  pgid=$(ps -o pgid= -p "$pid" | tr -d ' ')

  # Never signal our own group: a watch started from this shell would take dev.sh down with it.
  if [[ -n "$pgid" && "$pgid" != "$(ps -o pgid= -p $$ | tr -d ' ')" ]]; then
    kill -- "-$pgid" 2>/dev/null || true
  else
    kill "$pid" 2>/dev/null || true
  fi
  echo "Frontend watch stopped (PID $pid)"
}

health_check() {
  local name="$1"
  local url="$2"
  if curl -fsS --max-time 2 "$url" >/dev/null 2>&1; then
    echo "OK   $name ($url)"
  else
    echo "FAIL $name ($url)"
  fi
}

show_status() {
  echo "Health"
  health_check "nginx" "http://localhost:3000"
  health_check "api" "http://localhost:3000/health"
  echo ""

  local pid
  if pid=$(watch_pid); then
    echo "Frontend watch: running (PID $pid, log: scripts/logs/frontend-watch.log)"
  else
    echo "Frontend watch: stopped"
  fi
  echo ""

  dc ps
}

cmd_up() {
  check_env
  local build=""
  if [[ "${1:-}" == "--build" ]]; then
    build="--build"
  fi

  dc up -d --remove-orphans $build
  start_watch

  echo ""
  echo "App: http://localhost:3000 (health checks can take a few seconds to pass)"
  echo "Stop everything with: ./scripts/dev.sh down"
  echo ""
  show_status
}

cmd_down() {
  stop_watch
  dc down
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

case "$1" in
  up) cmd_up "${2:-}" ;;
  down) cmd_down ;;
  status) show_status ;;
  logs)
    shift
    dc logs -f "$@"
    ;;
  *)
    usage
    exit 1
    ;;
esac
