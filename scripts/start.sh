#!/bin/bash
set -e

if [ ! -f .env ]; then
  echo "Error: .env file not found. Run: cp .env.example .env"
  exit 1
fi

docker compose up -d
echo ""
echo "Services started:"
echo "  Frontend: http://localhost:3000"
echo "  API:      http://localhost:3001"
echo "  Health:   http://localhost:3001/health"
