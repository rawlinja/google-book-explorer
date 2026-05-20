#!/bin/bash
set -e

echo "Running api tests..."
pnpm --dir api test

echo "Running frontend tests..."
pnpm --dir frontend test

echo "All tests passed."
