# Bootstrap Data Seeding - Complete Overview

## ✅ YES - Bootstrap DOES Load Data

The `bootstrap_lighthouse.sh` script **automatically seeds the database** with initial data. Here's what gets created:

### Data Loaded by Bootstrap

#### 1. **Subscription Plans** (4 total)
- Basic (Free)
- Starter ($29/month)
- Professional ($79/month)
- Enterprise ($199/month)

#### 2. **Global Rewards** (3 total)
- Amazon Gift Card (1000 points)
- Starbucks Gift Card (800 points)
- Extra Vacation Day (2000 points)

#### 3. **Platform Settings**
- Platform name: "Lighthouse"
- Version: "1.0.0"

#### 4. **Test Tenant: Acme Corporation**
- Subdomain: `acme`
- Master budget: ₹1,00,000
- Status: Active

#### 5. **Test Users** (3 per tenant)
```
Email              | Role            | Password | Points Balance
admin@acme.com     | TENANT_ADMIN    | password | 0
lead@acme.com      | TENANT_LEAD     | password | 0 (Lead budget: ₹2,000)
user@acme.com      | CORPORATE_USER  | password | 500 points
```

---

## Seeding Scripts Executed by Bootstrap

The bootstrap script runs these in order:

### ✅ Executed Successfully
1. **seed_data.py** - Creates tables, plans, rewards, settings, and 3 test users
2. **seed_badges_recognitions.py** - Creates sample badges and recognition records

### ⚠️ Failed (Non-critical)
3. **seed_personas.py** - Import error (app not in Python path)
4. **seed_105_accounts.py** - Import error (app not in Python path)

These failures are **non-blocking** - the main seed data and test users were successfully created.

---

## How to Manually Seed Additional Data

If you want to seed more test accounts or regenerate data:

### Option 1: Reload Seed Data Only (Keep Schema)
```bash
./bootstrap_lighthouse.sh --seed-only
```

### Option 2: Complete Fresh Start (Delete Everything)
```bash
./bootstrap_lighthouse.sh --fresh
```

### Option 3: Run Specific Seed Script
```bash
# Fix the import issue first, then run:
docker-compose exec backend python seed_data.py

# Or try the 105 accounts script:
docker-compose exec backend python scripts/seed_105_accounts.py
```

---

## Checking Your Database

To verify what users exist:

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U lighthouse -d lighthouse

# Then run SQL:
SELECT id, email, full_name, role, is_active FROM users;
SELECT COUNT(*) as total_users FROM users;
SELECT * FROM tenants;
```

---

## Expected Output After Bootstrap

If bootstrap ran successfully, you should have:
- ✅ 4 subscription plans
- ✅ 3 global rewards
- ✅ 1 tenant (Acme Corporation)
- ✅ 3+ users (at least the test users)
- ✅ Platform settings

---

## Login Credentials (Test Users)

Use these to test the application:

```
Email: admin@acme.com
Password: password
Role: Tenant Admin

Email: lead@acme.com
Password: password
Role: Tenant Lead
Budget: ₹2,000

Email: user@acme.com
Password: password
Role: Corporate User
Points: 500
```

---

## If You Don't See Users

**Most likely cause:** The bootstrap didn't complete successfully.

**Solution:**
```bash
# Check bootstrap logs
docker-compose logs backend

# Or run fresh bootstrap
./bootstrap_lighthouse.sh --fresh

# Then verify
docker-compose exec postgres psql -U lighthouse -d lighthouse -c "SELECT COUNT(*) FROM users;"
```
