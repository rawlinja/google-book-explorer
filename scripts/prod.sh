#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: bash scripts/prod.sh <command>

Commands:
  up    Build and start production containers
  down  Stop production containers
EOF
}

check_env() {
  if [ ! -f "$ROOT_DIR/.env" ]; then
    echo "Error: .env file not found. Run: cp .env.example .env"
    exit 1
  fi
}

dc() {
  docker compose -f "$ROOT_DIR/docker-compose.yml" "$@"
}

cmd_up() {
  check_env
  echo "Building containers..."
  dc build

  echo ""
  dc up -d --remove-orphans

  echo ""
  echo "Services started:"
  echo "  App:    http://localhost:3000"
  echo "  Health: http://localhost:3000/health"
}

cmd_down() {
  dc down
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

case "$1" in
  up)   cmd_up ;;
  down) cmd_down ;;
  *)    usage; exit 1 ;;
esac
