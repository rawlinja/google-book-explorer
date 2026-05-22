#!/bin/bash
# Usage: ./scripts/logs.sh [service]   e.g. ./scripts/logs.sh nginx|api|redis
docker compose logs -f "$@"
