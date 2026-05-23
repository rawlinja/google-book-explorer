#!/bin/bash
set -e

if [ ! -f .env ]; then
  echo "Error: .env file not found. Run: cp .env.example .env"
  exit 1
fi

cleanup() {
  echo ""
  echo "Stopping..."
  docker compose down
  kill $(lsof -ti:3005) 2>/dev/null || true
}
trap 'cleanup; exit 0' INT TERM

docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --remove-orphans

echo ""
echo "Services started:"
echo "  App:    http://localhost:3000"
echo "  Health: http://localhost:3000/health"
echo ""
echo "Watching frontend for changes... (Ctrl+C to stop everything)"
pnpm --dir frontend watch
