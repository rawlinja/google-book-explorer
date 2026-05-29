#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: bash scripts/dev.sh <command>

Commands:
  up [--build]  Start containers and esbuild watch; pass --build to rebuild images first
  down          Stop containers and esbuild watch server
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

cmd_up() {
  check_env
  local build=""
  if [[ "${1:-}" == "--build" ]]; then
    build="--build"
  fi

  dc up -d --remove-orphans $build

  echo ""
  echo "Services started:"
  echo "  App:    http://localhost:3000"
  echo "  Health: http://localhost:3000/health"
  echo ""
  echo "Watching frontend for changes... (Ctrl+C to stop everything)"

  cleanup() {
    echo ""
    echo "Stopping..."
    dc down
    kill $(lsof -ti:3005) 2>/dev/null || true
  }
  trap 'cleanup; exit 0' INT TERM

  pnpm --dir "$ROOT_DIR/frontend" watch
}

cmd_down() {
  dc down
  if lsof -ti:3005 >/dev/null 2>&1; then
    echo "Stopping esbuild watch server on :3005..."
    kill $(lsof -ti:3005) 2>/dev/null || true
  fi
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

case "$1" in
  up)   cmd_up "${2:-}" ;;
  down) cmd_down ;;
  *)    usage; exit 1 ;;
esac
