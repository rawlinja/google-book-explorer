#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker first."
  exit 1
fi

cd "$ROOT_DIR"

# Check current status
postgres_running=$(docker ps --filter "name=postgres" --filter "status=running" -q)
redis_running=$(docker ps --filter "name=redis" --filter "status=running" -q)

if [[ -n "$postgres_running" && -n "$redis_running" ]]; then
  echo "PostgreSQL: running"
  echo "Redis: running"
  exit 0
fi

echo "Starting infrastructure..."
docker compose up -d postgres redis

# Wait for healthy status
echo "Waiting for services..."
max_attempts=30
attempt=0

while [[ $attempt -lt $max_attempts ]]; do
  pg_status=$(docker inspect --format='{{.State.Health.Status}}' postgres 2>/dev/null || echo "not found")
  redis_status=$(docker inspect --format='{{.State.Health.Status}}' redis 2>/dev/null || echo "not found")

  if [[ "$pg_status" == "healthy" && "$redis_status" == "healthy" ]]; then
    echo "PostgreSQL: healthy"
    echo "Redis: healthy"
    exit 0
  fi

  sleep 1
  ((attempt++))
done

echo "Warning: Services may not be fully ready. Check 'docker compose ps'"
