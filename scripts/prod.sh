#!/bin/bash
set -e

if [ ! -f .env ]; then
  echo "Error: .env file not found. Run: cp .env.example .env"
  exit 1
fi

echo "Building containers..."
docker compose build

echo ""
docker compose up -d --remove-orphans

echo ""
echo "Services started:"
echo "  App:    http://localhost:3000"
echo "  Health: http://localhost:3000/health"
