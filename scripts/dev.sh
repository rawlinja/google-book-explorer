#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WATCH_PID_FILE="/tmp/google-book-explorer-watch.pid"
WATCH_LOG_FILE="/tmp/google-book-explorer-watch.log"
WATCH_PORT=3005

usage() {
  cat <<'EOF'
Usage: bash scripts/dev.sh <command>

Commands:
  up [--build]  Start containers and the frontend watch in the background; --build rebuilds images first
  down          Stop the frontend watch and containers
  status        Show health checks, frontend watch state, and container status
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
  [[ -f "$WATCH_PID_FILE" ]] || return 1
  local pid
  pid=$(cat "$WATCH_PID_FILE")
  kill -0 "$pid" 2>/dev/null || return 1
  echo "$pid"
}

start_watch() {
  local pid
  if pid=$(watch_pid); then
    echo "Frontend watch already running (PID $pid)"
    return
  fi

  # Job control gives the watch its own process group, so down can stop pnpm and its node child together.
  set -m
  (cd "$ROOT_DIR/frontend" && exec pnpm watch) >"$WATCH_LOG_FILE" 2>&1 &
  echo $! >"$WATCH_PID_FILE"
  set +m
  echo "Frontend watch started (PID $(cat "$WATCH_PID_FILE"), log: $WATCH_LOG_FILE)"
}

stop_watch() {
  local pid
  if pid=$(watch_pid); then
    kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
    echo "Frontend watch stopped (PID $pid)"
  fi
  rm -f "$WATCH_PID_FILE"

  # Catches a watch left running by the old foreground script.
  if lsof -ti:"$WATCH_PORT" >/dev/null 2>&1; then
    echo "Stopping leftover process on :$WATCH_PORT..."
    kill $(lsof -ti:"$WATCH_PORT") 2>/dev/null || true
  fi
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
    echo "Frontend watch: running (PID $pid, log: $WATCH_LOG_FILE)"
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
  *)
    usage
    exit 1
    ;;
esac
