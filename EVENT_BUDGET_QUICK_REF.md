# Event Budget API - Quick Reference Card

## 🚀 Quick Start

```bash
# 1. Apply database migration
cd backend && alembic upgrade head

# 2. Start backend server
docker-compose up backend
# OR: cd backend && uvicorn app.main:app --reload

# 3. Test API (see examples below)
```

## 📋 Core Concepts

| Concept | Purpose | Key Fields |
|---------|---------|-----------|
| **Event** | Container for a specific activity/celebration | budget_amount, budget_committed, event_type |
| **EventOption** | Track or inventory item (e.g., "Singing", "Backpack") | total_available, committed_count |
| **Registration** | User's participation intent | status, qr_token, pickup_slot, amount_committed |

## 🔄 Registration Status Flow

```
PENDING → APPROVED → (stays or) → REJECTED/CANCELLED
  ↑                                      ↓
  └──────────────────────────────────────┘
            (approval revoked)
```

## 📊 Budget Tracking

```
Event Created
└─ budget_available = event_budget_amount (100%)

Registration Approved
└─ budget_committed += registration.amount_committed
   budget_available = event_budget_amount - budget_committed

Registration Cancelled
└─ budget_committed -= registration.amount_committed (rollback)
   budget_available increases
```

## 🛡️ Conflict Detection (4-Tier)

| Tier | Check | Failure Type | Resolver |
|------|-------|--------------|----------|
| 1 | Registration window open? | REGISTRATION_CLOSED | Extend registration dates |
| 2 | Event budget available? | BUDGET_EXHAUSTED | Increase event budget |
| 3 | Inventory available? | INVENTORY_EXHAUSTED | Offer alternatives |
| 4 | Pickup slot available? | SLOT_CONFLICT | Show available slots |

## 🔌 API Endpoints (13 Total)

### Event CRUD (5)
- `POST /events` → Create event
- `GET /events` → List events  
- `GET /events/{id}` → Get event
- `PUT /events/{id}` → Update event
- `DELETE /events/{id}` → Soft delete

### Options (2)
- `POST /events/{id}/options` → Add option
- `GET /events/{id}/options` → List options

### Registrations (4)
- `POST /events/{id}/register` → Register user
- `GET /events/{id}/registrations` → List registrations
- `GET /events/{id}/registrations/{rid}` → Get registration
- `PUT /events/{id}/registrations/{rid}` → Update status

### Analytics (2)
- `GET /events/{id}/budget-variance` → Budget report
- `POST /events/{id}/check-conflicts` → Pre-flight check

## 📝 Example: Complete Registration Workflow

### Step 1: Check for Conflicts (Optional)
```bash
curl -X POST http://localhost:8000/events/EVENT_ID/check-conflicts \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_option_id": "OPT_ID", "preferred_pickup_slot": "2024-07-15 10:00-11:00"}'

# Response if OK:
# {"has_conflict": false}

# Response if conflict:
# {
#   "has_conflict": true,
#   "conflict_type": "INVENTORY_EXHAUSTED",
#   "conflict_message": "No inventory available for Item X",
#   "available_alternatives": ["Item Y (50 slots)", "Item Z (30 slots)"]
# }
```

### Step 2: Register for Event
```bash
curl -X POST http://localhost:8000/events/EVENT_ID/register \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "EVENT_ID",
    "event_option_id": "OPT_ID",
    "preferred_pickup_slot": "2024-07-15 10:00-11:00",
    "notes": "Prefer morning"
  }'

# Response: Registration object with status=PENDING, unique qr_token
```

### Step 3: Organizer Approves
```bash
curl -X PUT http://localhost:8000/events/EVENT_ID/registrations/REG_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "assigned_pickup_slot": "2024-07-15 10:00-11:00",
    "notes": "Approved"
  }'

# Response: Registration with status=APPROVED, approved_at timestamp set
# Side effects:
# - event.budget_committed increased
# - event_option.committed_count increased
```

### Step 4: Check Budget Variance
```bash
curl -X GET http://localhost:8000/events/EVENT_ID/budget-variance \
  -H "Authorization: Bearer TOKEN"

# Response includes:
# {
#   "total_budget": 100000,
#   "budget_committed": 45000,
#   "budget_available": 55000,
#   "utilization_percentage": 45.0,
#   "registered_users_count": 150,
#   "approved_registrations_count": 75,
#   "pending_registrations_count": 75,
#   "option_variance": [...]
# }
```

## 🗄️ Database Tables (3)

```sql
-- Events: metadata + budget tracking
SELECT * FROM events 
WHERE tenant_id = 'YOUR_TENANT';

-- Options: inventory/tracks with stock limits
SELECT * FROM event_options 
WHERE event_id = 'EVENT_ID';

-- Registrations: user participation ledger
SELECT * FROM event_registrations 
WHERE event_id = 'EVENT_ID';
```

## 🔑 Key Metrics

| Metric | Formula | Purpose |
|--------|---------|---------|
| Budget Utilization % | (budget_committed / budget_amount) × 100 | See how much budget is used |
| Option Utilization % | (committed_count / total_available) × 100 | See inventory usage |
| Available Slots | total_available - committed_count | How many slots left |
| Budget Available | budget_amount - budget_committed | Remaining budget |

## ⚠️ Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Tenant context required" | Missing auth or tenant header | Send valid Authorization token |
| "Event not found" | Wrong event_id or different tenant | Verify event_id exists in your tenant |
| "INVENTORY_EXHAUSTED" | No slots available for option | Choose different option or increase total_available |
| "SLOT_CONFLICT" | Pickup slot has 10+ approvals | Assign different slot, API suggests alternatives |
| "BUDGET_EXHAUSTED" | Event budget fully committed | Increase event budget amount |

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| EVENT_BUDGET_IMPLEMENTATION.md | Complete technical documentation |
| EVENT_BUDGET_TESTING.md | Testing guide with cURL examples |
| PHASE1_SUMMARY.md | High-level overview |
| PHASE1_CHECKLIST.md | Completion verification |
| PHASE1_FILE_STRUCTURE.md | File organization reference |

## 🎯 Key URLs

```
POST   http://localhost:8000/events
GET    http://localhost:8000/events?skip=0&limit=10
GET    http://localhost:8000/events/{event_id}
PUT    http://localhost:8000/events/{event_id}
DELETE http://localhost:8000/events/{event_id}

POST   http://localhost:8000/events/{event_id}/options
GET    http://localhost:8000/events/{event_id}/options

POST   http://localhost:8000/events/{event_id}/register
GET    http://localhost:8000/events/{event_id}/registrations
GET    http://localhost:8000/events/{event_id}/registrations/{reg_id}
PUT    http://localhost:8000/events/{event_id}/registrations/{reg_id}

GET    http://localhost:8000/events/{event_id}/budget-variance
POST   http://localhost:8000/events/{event_id}/check-conflicts
```

## 🧪 Quick Test

```bash
# 1. Create event
EVENT_ID=$(curl -s -X POST http://localhost:8000/events \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Event","event_type":"ANNUAL_DAY","event_budget_amount":10000,"event_date":"2024-07-15T10:00:00Z","registration_start_date":"2024-07-01T00:00:00Z","registration_end_date":"2024-07-14T23:59:59Z"}' \
  | jq -r '.id')

# 2. Check budget
curl -s http://localhost:8000/events/$EVENT_ID/budget-variance \
  -H "Authorization: Bearer TOKEN" | jq '.budget_available'

# 3. Register user
curl -s -X POST http://localhost:8000/events/$EVENT_ID/register \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_id":"'$EVENT_ID'"}' | jq '.status'

# Expected: "PENDING"
```

## 📞 Support

- See EVENT_BUDGET_TESTING.md for extensive examples
- Check database queries in EVENT_BUDGET_TESTING.md for debugging
- Review EVENT_BUDGET_IMPLEMENTATION.md for architecture details

---

**Status**: Ready for Testing ✅  
**Created**: January 27, 2026  
**Version**: 1.0 (Phase 1)
