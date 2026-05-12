#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-books}"

if ! docker ps --filter "name=postgres" --filter "status=running" -q | grep -q .; then
  echo "Error: postgres container is not running. Start it with: ./scripts/start-infra.sh"
  exit 1
fi

echo "Ensuring database exists..."
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres \
  -c "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB'" \
  | grep -q 1 || docker compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres \
  -c "CREATE DATABASE $POSTGRES_DB"

echo "Creating tables..."
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  < backend/migrations/001_schema.sql

echo "Seeding books table..."
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<'SQL'
INSERT INTO books (volume_id, title, authors, categories, description, metadata)
VALUES
  (
    'zyTCAlFPjgYC',
    'The Pragmatic Programmer',
    ARRAY['David Thomas', 'Andrew Hunt'],
    ARRAY['Computers'],
    'Your journey to mastery. Illustrates the best practices and major pitfalls of many different aspects of software development.',
    '{"publisher": "Addison-Wesley", "publishedDate": "2019-09-13", "pageCount": 352, "language": "en"}'
  ),
  (
    'WN0LEAAAQBAJ',
    'Designing Data-Intensive Applications',
    ARRAY['Martin Kleppmann'],
    ARRAY['Computers'],
    'The big ideas behind reliable, scalable, and maintainable systems. Covers databases, distributed systems, and data processing.',
    '{"publisher": "O''Reilly Media", "publishedDate": "2017-03-16", "pageCount": 611, "language": "en"}'
  ),
  (
    'MTpsAQAAQBAJ',
    'Clean Code',
    ARRAY['Robert C. Martin'],
    ARRAY['Computers'],
    'A handbook of agile software craftsmanship. Even bad code can function, but if code isn''t clean, it can bring a development organization to its knees.',
    '{"publisher": "Prentice Hall", "publishedDate": "2008-08-01", "pageCount": 431, "language": "en"}'
  ),
  (
    'IlAJBAAAQBAJ',
    'The Phoenix Project',
    ARRAY['Gene Kim', 'Kevin Behr', 'George Spafford'],
    ARRAY['Computers', 'Business'],
    'A novel about IT, DevOps, and helping your business win. Bill discovers the ancient principles of the Toyota Production System applied to IT.',
    '{"publisher": "IT Revolution Press", "publishedDate": "2013-01-10", "pageCount": 345, "language": "en"}'
  ),
  (
    'aX9bDwAAQBAJ',
    'Staff Engineer',
    ARRAY['Will Larson'],
    ARRAY['Computers', 'Business'],
    'Leadership beyond the management track. A guide to reaching and succeeding at the Staff Engineer level in technology companies.',
    '{"publisher": "Independently Published", "publishedDate": "2021-09-17", "pageCount": 187, "language": "en"}'
  ),
  (
    'r6uzAAAAMAAJ',
    'The Mythical Man-Month',
    ARRAY['Frederick P. Brooks Jr.'],
    ARRAY['Computers'],
    'Essays on software engineering. Why software projects fail and what you can do about it — as relevant today as when first published in 1975.',
    '{"publisher": "Addison-Wesley", "publishedDate": "1995-08-02", "pageCount": 336, "language": "en"}'
  ),
  (
    'TVijDwAAQBAJ',
    'A Philosophy of Software Design',
    ARRAY['John Ousterhout'],
    ARRAY['Computers'],
    'How to decompose complex software systems into modules that can be implemented relatively independently. Focuses on complexity management.',
    '{"publisher": "Yaknyam Press", "publishedDate": "2018-04-06", "pageCount": 178, "language": "en"}'
  ),
  (
    'dp4TEAAAQBAJ',
    'System Design Interview',
    ARRAY['Alex Xu'],
    ARRAY['Computers'],
    'An insider''s guide to system design interviews. Step-by-step framework for tackling large-scale system design questions.',
    '{"publisher": "Independently Published", "publishedDate": "2020-06-12", "pageCount": 309, "language": "en"}'
  )
ON CONFLICT (volume_id) DO NOTHING;

SELECT COUNT(*) AS books_seeded FROM books;
SQL

echo "Done."
