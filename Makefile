.PHONY: help migrate seed

# Simple Makefile helpers for common dev tasks 🔧
# Usage:
#   make migrate     # run alembic migrations in the backend container
#   make seed        # run migrations + SQLAlchemy seeders (idempotent)

DC := docker-compose

help:
	@echo "Targets: migrate, seed"

migrate:
	@echo "🔁 Running migrations..."
	@$(DC) exec -T backend /bin/sh -lc 'PYTHONPATH=/app python run_migrations.py upgrade'

seed: migrate
	@echo "🌱 Running SQLAlchemy seeders (idempotent)..."
	@$(DC) exec -T backend /bin/sh -lc 'PYTHONPATH=/app python scripts/seed_105_accounts.py'
	@$(DC) exec -T backend /bin/sh -lc 'PYTHONPATH=/app python seed_badges_recognitions.py'
	@$(DC) exec -T backend /bin/sh -lc 'PYTHONPATH=/app python scripts/add_acme_users_and_recognitions.py'
	@$(DC) exec -T backend /bin/sh -lc 'PYTHONPATH=/app python scripts/seed_personas.py'
	@$(DC) exec -T backend /bin/sh -lc 'PYTHONPATH=/app python scripts/seed_passwords.py'
	@echo "✅ Seeding complete."
