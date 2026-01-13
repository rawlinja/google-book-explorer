#!/bin/bash

echo "=== Service Status ==="

# Check Redis
if nc -z localhost 6379 2>/dev/null; then
  echo "✓ Redis running on port 6379"
else
  echo "✗ Redis not running"
  echo "  Start with: brew services start redis"
fi

# Check Memcached
if nc -z localhost 11211 2>/dev/null; then
  echo "✓ Memcached running on port 11211"
else
  echo "✗ Memcached not running"
  echo "  Start with: brew services start memcached"
fi

# Check PostgreSQL
if nc -z localhost 5432 2>/dev/null; then
  echo "✓ PostgreSQL running on port 5432"
else
  echo "✗ PostgreSQL not running"
  echo "  Start with: brew services start postgresql"
fi
