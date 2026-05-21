#!/bin/bash
set -e

echo "Typechecking api..."
pnpm --dir api typecheck

echo "Building api..."
pnpm --dir api build

echo "Typechecking frontend..."
pnpm --dir frontend typecheck

echo "Building frontend..."
pnpm --dir frontend build

echo "Done."
