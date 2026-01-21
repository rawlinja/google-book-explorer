#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT_DIR/scripts/pids"
LOG_DIR="$ROOT_DIR/scripts/logs"

mkdir -p "$PID_DIR" "$LOG_DIR"

# Load environment variables
ENV_FILE="$ROOT_DIR/.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

start_service() {
  local name="$1"
  local dir="$2"
  local cmd="$3"
  local pid_file="$PID_DIR/${name}.pid"
  local log_file="$LOG_DIR/${name}.log"

  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      echo "$name already running (pid: $pid)"
      return 0
    fi
    rm -f "$pid_file"
  fi

  echo "Starting $name..."
  (cd "$dir" && nohup $cmd >"$log_file" 2>&1 & echo $! >"$pid_file")

  local pid
  pid="$(cat "$pid_file")"
  echo "$name started (pid: $pid) - logs: $log_file"
}

start_service "backend" "$ROOT_DIR/backend" "yarn dev"
start_service "frontend" "$ROOT_DIR/frontend" "yarn dev"

echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
