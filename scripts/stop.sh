#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT_DIR/scripts/pids"

stop_service() {
  local name="$1"
  local port="$2"
  local pid_file="$PID_DIR/${name}.pid"

  # Try PID file first
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid"
      echo "$name stopped (pid: $pid)"
      rm -f "$pid_file"
      return 0
    fi
    rm -f "$pid_file"
  fi

  # Fallback: kill by port
  local pids
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    for pid in $pids; do
      kill "$pid" 2>/dev/null || true
      echo "$name stopped (pid: $pid)"
    done
    return 0
  fi

  echo "$name not running"
}

stop_service "backend" 3001
stop_service "frontend" 3000
