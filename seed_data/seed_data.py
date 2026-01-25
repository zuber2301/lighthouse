# DEPRECATED: This script was an ad-hoc psycopg2 seeder and has been replaced by
# `backend/scripts/seed_105_accounts.py` which uses SQLAlchemy (async) and is idempotent.
# Keep this file for reference only. To seed the database use:
#   docker-compose exec backend /bin/sh -lc 'PYTHONPATH=/app python scripts/seed_105_accounts.py'

import psycopg2
import bcrypt
import random
from datetime import datetime
import uuid
import re

# Optional dependency for realistic synthetic data; fallback to small name pools if not present
try:
    from faker import Faker
    fake = Faker()
except Exception:
    fake = None
    FIRST_NAMES = ['Alex','Jordan','Taylor','Morgan','Casey','Jamie','Robin','Sam','Chris','Pat']
    LAST_NAMES = ['Smith','Johnson','Lee','Brown','Garcia','Martinez','Davis','Miller','Wilson','Anderson']


def new_uuid():
    return str(uuid.uuid4())

# Database Connection Details (can be overridden with env vars)
import os
DB_CONFIG = {
    "dbname": os.environ.get("PGDATABASE", os.environ.get("DB_NAME", "lighthouse")),
    "user": os.environ.get("PGUSER", os.environ.get("DB_USER", "lighthouse")),
    "password": os.environ.get("PGPASSWORD", os.environ.get("DB_PASSWORD", "lighthouse")),
    "host": os.environ.get("PGHOST", os.environ.get("DB_HOST", "postgres")),
    "port": os.environ.get("PGPORT", os.environ.get("DB_PORT", "5432"))
}

DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'Human Resources', 'Product']
JOB_TITLES = {
    'Engineering': ['Software Engineer', 'DevOps Specialist', 'Frontend Dev', 'QA Engineer'],
    'Marketing': ['Content Strategist', 'SEO Specialist', 'Growth Lead', 'Brand Manager'],
    'Sales': ['Account Executive', 'SDR', 'Sales Manager', 'Partnerships'],
    'Human Resources': ['People Partner', 'Talent Scout', 'HR Generalist'],
    'Product': ['Product Manager', 'UX Designer', 'Data Analyst']
}

def get_hashed_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def generate_random_date(start_year, end_year):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    return start + (end - start) * random.random()

def bootstrap():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        password_hash = get_hashed_password("password")

        print("🚀 Starting LightHouse Bootstrap (105 Accounts)...")

        # Helper to check if a user exists
        def user_exists(email):
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            return cur.fetchone() is not None

        # Name/email helpers (use Faker when available for realistic names)
        def make_name():
            if fake:
                return fake.name()
            return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

        def make_unique_email(full_name, subdomain):
            # Build an email slug from the name, keep only alnum and dots
            base = re.sub(r'[^a-z0-9]+', '.', full_name.lower()).strip('.')
            email = f"{base}@{subdomain}.com"
            suffix = 1
            while user_exists(email):
                email = f"{base}{suffix}@{subdomain}.com"
                suffix += 1
            return email

        # 1. CREATE PLATFORM OWNER (Global Admin)
        # Note: tenant_id is NULL for the Platform Owner as they are global
        # If an old owner email exists and super_user already exists, remove old owner to avoid duplicates
        if user_exists('owner@lighthouse.com') and user_exists('super_user@lighthouse.com'):
            cur.execute("DELETE FROM users WHERE email = %s", ('owner@lighthouse.com',))
            print("✅ Removed legacy owner@lighthouse.com (super_user exists)")

        # If an old owner email exists, migrate it to the new super_user email
        if user_exists('owner@lighthouse.com') and not user_exists('super_user@lighthouse.com'):
            cur.execute("UPDATE users SET email = %s, full_name = %s WHERE email = %s RETURNING id",
                        ('super_user@lighthouse.com', 'LightHouse Super User', 'owner@lighthouse.com'))
            if cur.fetchone():
                print("✅ Renamed owner@lighthouse.com -> super_user@lighthouse.com")

        if not user_exists('super_user@lighthouse.com'):
            cur.execute(
                """INSERT INTO users (id, tenant_id, full_name, email, hashed_password, role, job_title, points_balance, lead_budget_balance, is_active) 
                   VALUES (%s, NULL, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (new_uuid(), "LightHouse Super User", "super_user@lighthouse.com", password_hash, "PLATFORM_OWNER", "Chief Platform Architect", 0, 0, True)
            )
            print("✅ Created Platform Owner: super_user@lighthouse.com")
        else:
            print("ℹ️ Platform Owner already exists: super_user@lighthouse.com")

        tenants = [
            {"name": "Triton Industries", "subdomain": "triton", "budget": 1000000},
            {"name": "UniMind Tech", "subdomain": "unimind", "budget": 500000}
        ]

        for t in tenants:
            # 2. Create Tenant (idempotent - use existing if present)
            cur.execute("SELECT id FROM tenants WHERE subdomain = %s", (t['subdomain'],))
            existing = cur.fetchone()
            if existing:
                tenant_id = existing[0]
                print(f"ℹ️ Tenant already exists: {t['name']} (id={tenant_id})")
            else:
                cur.execute(
                    "INSERT INTO tenants (id, name, subdomain, master_budget_balance) VALUES (%s, %s, %s, %s) RETURNING id",
                    (new_uuid(), t['name'], t['subdomain'], t['budget'])
                )
                tenant_id = cur.fetchone()[0]
                print(f"✅ Created Tenant: {t['name']} (id={tenant_id})")

            # 3. Create 2 Tenant Admins per company
            for i in range(1, 3):
                full_name = make_name()
                admin_email = make_unique_email(full_name, t['subdomain'])
                if user_exists(admin_email):
                    print(f"ℹ️ Tenant Admin already exists: {admin_email}")
                    continue
                cur.execute(
                    """INSERT INTO users (id, tenant_id, full_name, email, hashed_password, role, job_title, date_of_birth, hire_date, points_balance, lead_budget_balance, is_active) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (new_uuid(), tenant_id, full_name, admin_email, 
                     password_hash, 'TENANT_ADMIN', 'HR Director', '1985-05-10', '2020-01-01', 0, 0, True)
                )

            # 4. Create Leads and Users
            user_count = 0
            for d_name in DEPARTMENTS:
                # 2 Leads per Dept
                lead_emails = []
                for l in range(1, 3):
                    full_name = make_name()
                    lead_email = make_unique_email(full_name, t['subdomain'])
                    if user_exists(lead_email):
                        print(f"ℹ️ Lead user already exists: {lead_email}")
                    else:
                        cur.execute(
                            """INSERT INTO users (id, tenant_id, department, full_name, email, hashed_password, role, job_title, date_of_birth, hire_date, points_balance, lead_budget_balance, is_active) 
                               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                            (new_uuid(), tenant_id, d_name, full_name, lead_email, 
                             password_hash, 'TENANT_LEAD', f"Head of {d_name}", '1988-03-15', '2021-06-01', 5000, 0, True)
                        )
                        cur.fetchone()
                        user_count += 1
                    lead_emails.append(lead_email)

                # 8 Corporate Users per Dept (Approx)
                for u in range(1, 9):
                    if user_count >= 50: break
                    full_name = make_name()
                    email = make_unique_email(full_name, t['subdomain'])
                    if user_exists(email):
                        print(f"ℹ️ Corporate user already exists: {email}")
                        user_count += 1
                        continue
                    cur.execute(
                        """INSERT INTO users (id, tenant_id, department, full_name, email, hashed_password, role, job_title, date_of_birth, hire_date, points_balance, lead_budget_balance, is_active) 
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                        (new_uuid(), tenant_id, d_name, full_name, email, 
                         password_hash, 'CORPORATE_USER', random.choice(JOB_TITLES[d_name]), 
                         generate_random_date(1990, 2002).date(), generate_random_date(2021, 2025).date(), random.randint(0, 2500), 0, True)
                    )
                    user_count += 1

            print(f"✅ Seeded {t['name']} with {user_count} users.")

        conn.commit()
        print("\n✨ SYSTEM READY. Log in as super_user@lighthouse.com / password to start.")

    except Exception as error:
        print(f"❌ Error: {error}")
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    bootstrap()