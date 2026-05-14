#!/bin/bash
set -e

docker compose up --build -d
echo ""
echo "Containers rebuilt and running:"
echo "  Frontend: http://localhost:3000"
echo "  Gateway:  http://localhost:3001"
echo "  Health:   http://localhost:3001/health"
