#!/usr/bin/env bash
set -euo pipefail

# Run tests inside Docker Compose with Postgres + Redis
# Usage: ./scripts/run_tests_in_docker.sh

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

export USE_PG_FOR_TESTS=1

# Start Postgres and Redis services


# Use `docker-compose` CLI (some environments don't have `docker compose` subcommand)
if command -v docker-compose >/dev/null 2>&1; then
	DC="docker-compose"
else
	DC="docker compose"
fi

# Start Postgres and Redis services
$DC up -d postgres redis

# Build backend (so tests run with current code)
$DC build backend

# Run migrations inside a one-off backend container
# Alembic expects a sync DB driver; override DATABASE_URL to a sync psycopg URL for the migration step.
MIGRATE_DB_URL="postgresql://lighthouse:lighthouse@postgres:5432/lighthouse"

# Reset Postgres schema to ensure a clean database for the test run
docker-compose exec -T postgres psql -U lighthouse -d lighthouse -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Create tables directly from SQLAlchemy models (avoids running Alembic migrations in this test runner)
# Use a sync engine in a short Python one-liner so psycopg2 is used and SQLAlchemy creates the tables in order.
$DC run --rm backend bash -lc "cd /app && pip install psycopg2-binary >/dev/null 2>&1 || true && python3 - <<'PY'
from sqlalchemy import create_engine
from app.db.base import Base
engine = create_engine('postgresql://lighthouse:lighthouse@postgres:5432/lighthouse')
Base.metadata.create_all(engine)
print('created tables')
PY"

# Run pytest inside a one-off backend container
# Keep PYTHONPATH and env so tests pick up DATABASE_URL from compose
$DC run --rm -e USE_PG_FOR_TESTS=1 backend bash -lc "cd /app && pip install aiosqlite >/dev/null 2>&1 || true && pytest -q"

# Tear down services
$DC down

echo "Tests finished."
