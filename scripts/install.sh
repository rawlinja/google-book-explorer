#!/bin/bash
set -e

echo "Installing frontend dependencies..."
(cd frontend && pnpm install)

echo "Installing api dependencies..."
(cd api && pnpm install)

echo "Done."
