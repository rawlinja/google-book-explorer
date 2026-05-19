#!/bin/bash
set -e

echo "Installing frontend dependencies..."
pnpm install --dir frontend

echo "Installing api dependencies..."
pnpm install --dir api

echo "Done."
