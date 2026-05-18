#!/bin/bash
set -e

echo "Installing frontend dependencies..."
pnpm install --dir frontend

echo "Installing gateway dependencies..."
pnpm install --dir gateway

echo "Installing backend dependencies..."
uv sync --project backend

echo "Done."
