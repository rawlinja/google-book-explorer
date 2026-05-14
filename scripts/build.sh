#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Building frontend..."
cd "$ROOT/frontend"
pnpm build
echo "  ✓ frontend/dist/"

echo ""
echo "Building gateway..."
cd "$ROOT/gateway"
pnpm build
echo "  ✓ gateway/dist/"

echo ""
echo "Installing backend dependencies..."
cd "$ROOT/backend"
uv pip install -e "." --quiet
echo "  ✓ backend ready"

echo ""
echo "Build complete."
