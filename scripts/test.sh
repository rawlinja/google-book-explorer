#!/bin/bash
set -e

echo "=== API ==="
echo "-- typecheck"
pnpm --dir api typecheck

echo "-- format"
pnpm --dir api format

echo "-- tests"
pnpm --dir api test

echo ""
echo "=== Frontend ==="
echo "-- typecheck"
pnpm --dir frontend typecheck

echo "-- lint"
pnpm --dir frontend lint

echo "-- tests"
pnpm --dir frontend test

echo ""
echo "All checks passed."
