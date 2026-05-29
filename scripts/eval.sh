#!/bin/bash
set -e

if [ ! -f .env ]; then
  echo "Error: .env file not found. Run: cp .env.example .env"
  exit 1
fi

echo "=== Routing Evals ==="
pnpm --dir api eval
