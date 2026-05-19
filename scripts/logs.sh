#!/bin/bash
# Usage: ./scripts/logs.sh [service]   e.g. ./scripts/logs.sh api
docker compose logs -f "$@"
