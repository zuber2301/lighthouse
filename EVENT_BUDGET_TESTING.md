# Event Budget API - Quick Reference & Testing Guide

## Quick Start

### 1. Run Migration
```bash
cd backend
alembic upgrade head
```

### 2. Start Backend Server
```bash
# From workspace root
docker-compose up backend
# or locally
cd backend
uvicorn app.main:app --reload --port 8000
```

### 3. API Base URL
```
http://localhost:8000/events
```

---

## cURL Testing Examples

### Create an Event
```bash
curl -X POST http://localhost:8000/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Festival 2024",
    "description": "Annual summer celebration",
    "event_type": "ANNUAL_DAY",
    "event_budget_amount": 100000,
    "event_date": "2024-07-15T10:00:00Z",
    "registration_start_date": "2024-07-01T00:00:00Z",
    "registration_end_date": "2024-07-14T23:59:59Z",
    "options": [
      {
        "option_name": "Dancing Track",
        "option_type": "TRACK",
        "description": "Participate in dancing",
        "total_available": 50,
        "cost_per_unit": 1000
      },
      {
        "option_name": "Leather Jacket",
        "option_type": "INVENTORY",
        "description": "Limited edition jacket",
        "total_available": 200,
        "cost_per_unit": 2000
      }
    ]
  }'
```

### List Events
```bash
curl -X GET "http://localhost:8000/events?skip=0&limit=10&is_active=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Event Details
```bash
curl -X GET http://localhost:8000/events/EVENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Register for Event
```bash
curl -X POST http://localhost:8000/events/EVENT_ID/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "EVENT_ID",
    "event_option_id": "OPTION_ID",
    "preferred_pickup_slot": "2024-07-15 10:00-11:00",
    "notes": "Prefer morning slot"
  }'
```

### Check for Conflicts (Before Registering)
```bash
curl -X POST http://localhost:8000/events/EVENT_ID/check-conflicts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_option_id": "OPTION_ID",
    "preferred_pickup_slot": "2024-07-15 10:00-11:00"
  }'
```

### Approve a Registration
```bash
curl -X PUT http://localhost:8000/events/EVENT_ID/registrations/REGISTRATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "assigned_pickup_slot": "2024-07-15 10:00-11:00",
    "notes": "Approved for morning shift"
  }'
```

### Get Budget Variance Report
```bash
curl -X GET http://localhost:8000/events/EVENT_ID/budget-variance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Expected Responses

### Successful Registration
```json
{
  "id": "reg-12345",
  "event_id": "evt-001",
  "user_id": "user-001",
  "event_option_id": "opt-001",
  "status": "PENDING",
  "qr_token": "a1b2c3d4e5f6",
  "preferred_pickup_slot": "2024-07-15 10:00-11:00",
  "assigned_pickup_slot": null,
  "amount_committed": 0,
  "notes": "Prefer morning slot",
  "created_at": "2024-07-01T10:00:00Z",
  "approved_at": null
}
```

### Conflict Detection (Inventory Exhausted)
```json
{
  "has_conflict": true,
  "conflict_type": "INVENTORY_EXHAUSTED",
  "conflict_message": "No inventory available for Leather Jacket",
  "available_alternatives": [
    "Cotton T-Shirt (45 slots)",
    "Event Mug (120 slots)"
  ]
}
```

### Conflict Detection (Slot Overbooked)
```json
{
  "has_conflict": true,
  "conflict_type": "SLOT_CONFLICT",
  "conflict_message": "Pickup slot 2024-07-15 10:00-11:00 is fully booked",
  "available_alternatives": [
    "11:00-12:00 (8 available)",
    "12:00-13:00 (10 available)",
    "13:00-14:00 (9 available)"
  ]
}
```

### Budget Variance Report
```json
{
  "event_id": "evt-001",
  "event_name": "Summer Festival 2024",
  "total_budget": 100000,
  "budget_committed": 45000,
  "budget_available": 55000,
  "utilization_percentage": 45.0,
  "registered_users_count": 150,
  "approved_registrations_count": 75,
  "pending_registrations_count": 75,
  "option_variance": [
    {
      "option_id": "opt-001",
      "option_name": "Dancing Track",
      "total_available": 50,
      "committed_count": 30,
      "available_slots": 20,
      "utilization_percentage": 60.0
    },
    {
      "option_id": "opt-002",
      "option_name": "Leather Jacket",
      "total_available": 200,
      "committed_count": 180,
      "available_slots": 20,
      "utilization_percentage": 90.0
    }
  ]
}
```

---

## Test Scenarios

### Scenario 1: Complete Happy Path
1. Create event with 2 options
2. Register 3 users (should all succeed)
3. Approve 2 registrations
4. Check budget variance (should show 2 committed out of 3)
5. Try to register when option is full (should fail)

### Scenario 2: Budget Exhaustion
1. Create event with budget = 5000
2. Register users with amount_committed = 2000 each
3. First 2 registrations approval succeeds
4. 3rd registration approval should fail (budget exhausted)

### Scenario 3: Slot Overbooking
1. Create event with 1 option
2. Register 10 users for same pickup slot
3. All 10 should succeed (MAX_PER_SLOT = 10)
4. 11th user registration should fail with SLOT_CONFLICT

### Scenario 4: Inventory Management
1. Create event with option (total_available = 50)
2. Register 50 users for that option
3. All 50 should be PENDING (not yet approved)
4. Approve 30 registrations (committed_count = 30)
5. Try to register 51st user (should fail - inventory exhausted)
6. Cancel 5 approvals (committed_count = 25)
7. Now able to register 25 more users (25 available slots)

---

## Database Queries for Debugging

### Check Event Budget Status
```sql
SELECT 
  e.id, e.name, e.event_budget_amount, e.budget_committed,
  (e.event_budget_amount - e.budget_committed) as available,
  (e.budget_committed::float / e.event_budget_amount * 100)::int as utilization_pct
FROM events e
WHERE e.tenant_id = 'YOUR_TENANT_ID'
ORDER BY e.created_at DESC;
```

### Check Registration Status
```sql
SELECT 
  e.name as event,
  COUNT(*) as total_registrations,
  COUNT(CASE WHEN er.status = 'APPROVED' THEN 1 END) as approved,
  COUNT(CASE WHEN er.status = 'PENDING' THEN 1 END) as pending,
  COUNT(CASE WHEN er.status = 'REJECTED' THEN 1 END) as rejected
FROM event_registrations er
JOIN events e ON er.event_id = e.id
WHERE e.tenant_id = 'YOUR_TENANT_ID'
GROUP BY e.id, e.name;
```

### Check Inventory Utilization
```sql
SELECT 
  eo.event_id, eo.option_name, eo.option_type,
  eo.total_available, eo.committed_count,
  (eo.total_available - eo.committed_count) as available_slots,
  (eo.committed_count::float / eo.total_available * 100)::int as utilization_pct
FROM event_options eo
ORDER BY eo.created_at DESC;
```

### Check Pickup Slot Utilization
```sql
SELECT 
  er.assigned_pickup_slot,
  COUNT(*) as registrations,
  COUNT(CASE WHEN er.status = 'APPROVED' THEN 1 END) as approved
FROM event_registrations er
WHERE er.assigned_pickup_slot IS NOT NULL
GROUP BY er.assigned_pickup_slot
ORDER BY er.assigned_pickup_slot;
```

---

## Common Issues & Solutions

### Issue: "Tenant context required"
**Cause:** Not authenticated or tenant header missing
**Solution:** Include valid Authorization token and ensure tenant middleware is running

### Issue: "Event not found"
**Cause:** Event doesn't exist or belongs to different tenant
**Solution:** Verify event_id and tenant_id match

### Issue: Conflict detection not working
**Cause:** Event time window may be closed
**Solution:** Check registration_start_date and registration_end_date

### Issue: Budget not updating after approval
**Cause:** amount_committed might be 0 on registration
**Solution:** Set amount_committed when creating registration, or use option cost_per_unit

---

## Performance Notes

- Indices on `tenant_id`, `event_id`, `user_id`, `qr_token` ensure fast lookups
- Budget variance calculation is O(n) where n = number of options + registrations
- For events with 1000+ registrations, consider pagination and caching

---

## Cleanup

### Delete All Event Data (for testing)
```bash
docker-compose exec postgres psql -U postgres -d lighthouse_db -c "
TRUNCATE TABLE event_registrations CASCADE;
TRUNCATE TABLE event_options CASCADE;
TRUNCATE TABLE events CASCADE;
"
```

---

## Next Steps

1. **Frontend Integration**: Build UI for event creation and registration
2. **Notification System**: Email users when registrations are approved
3. **Payment Integration**: Connect to payment processor if charges apply
4. **Admin Dashboard**: Real-time budget and registration metrics
5. **Batch Operations**: Approve/reject multiple registrations at once
