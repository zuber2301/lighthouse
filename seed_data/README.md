# Seed Data — How to run (📋)

This folder historically contained an ad-hoc psycopg2 seeder (`seed_data.py`). The preferred, production-quality seeders now live in `backend/scripts` and are SQLAlchemy-based (async) and idempotent.

Quick summary
- Recommended: Use the backend SQLAlchemy seeders (idempotent).
- Ad-hoc fallback: `seed_data/seed_data.py` remains for reference and local runs.

Prerequisites
- Docker & docker-compose
- Backend image built from `backend/Dockerfile` (Makefile handles this)
- Faker is already in `backend/requirements.txt` and installed in the running backend container

Run everything (recommended)
1. Start required services (Postgres + backend):

   docker-compose up -d postgres backend

2. Run the grouped seeding target (runs migrations then seeders):

   make seed

This runs these seeders inside the `backend` container (idempotent):
- `scripts/seed_105_accounts.py` (105-account bootstrap)
- `seed_badges_recognitions.py`
- `scripts/add_acme_users_and_recognitions.py`
- `scripts/seed_personas.py`
- `scripts/seed_passwords.py`

Run a single backend seeder manually
- Example (seed accounts only):

  docker-compose exec -T backend /bin/sh -lc 'PYTHONPATH=/app python scripts/seed_105_accounts.py'

- Example (badges & recognitions):

  docker-compose exec -T backend /bin/sh -lc 'PYTHONPATH=/app python seed_badges_recognitions.py'

Legacy ad-hoc script (reference only)
- `seed_data/seed_data.py` uses psycopg2 directly and now generates realistic names (Faker if available). To run it locally in a temporary container (not required):

  docker run --rm -v $(pwd):/work -w /work --network lighthouse_default python:3.12 bash -lc "pip install bcrypt psycopg2-binary --no-cache-dir && python seed_data/seed_data.py"

Notes
- All backend seeders are idempotent: safe to re-run without creating duplicates.
- If you need a pristine demo DB, ask for a `make seed-clean` target (destructive; drops & recreates schema before seeding).
- If you hit issues:
  - Ensure migrations are applied: `docker-compose exec backend python run_migrations.py upgrade`
  - Ensure `DATABASE_URL` is set for non-Docker runs

Contact / Ownership
- Seed logic: `backend/scripts/seed_105_accounts.py`
- Legacy script (reference): `seed_data/seed_data.py`

---
Happy seeding! 🚀
