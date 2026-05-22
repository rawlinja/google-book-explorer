#!/bin/bash
docker compose down

# Kill esbuild watch server if running (dev only)
if lsof -ti:3005 >/dev/null 2>&1; then
  echo "Stopping esbuild watch server on :3005..."
  kill $(lsof -ti:3005) 2>/dev/null || true
fi
