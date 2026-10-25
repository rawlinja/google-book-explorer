#!/bin/bash
set -e

echo "=== API ==="
echo "-- typecheck"
(cd api && pnpm typecheck)

echo "-- format"
(cd api && pnpm format:check)

echo "-- tests"
(cd api && pnpm test)

echo ""
echo "=== Frontend ==="
echo "-- typecheck"
(cd frontend && pnpm typecheck)

echo "-- lint"
(cd frontend && pnpm lint)

echo "-- tests"
(cd frontend && pnpm test)

echo ""
echo "All checks passed."
