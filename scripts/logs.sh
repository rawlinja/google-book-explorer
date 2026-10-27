#!/usr/bin/env bash
# Usage: ./scripts/logs.sh [service]   e.g. ./scripts/logs.sh nginx|api|redis
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

docker compose -f "$ROOT_DIR/docker-compose.yml" -f "$ROOT_DIR/docker-compose.dev.yml" logs -f "$@"
