#!/bin/bash
set -e

echo "Typechecking api..."
(cd api && pnpm typecheck)

echo "Building api..."
(cd api && pnpm build)

echo "Typechecking frontend..."
(cd frontend && pnpm typecheck)

echo "Building frontend..."
(cd frontend && pnpm build)

echo "Done."
