# Phase 6 Deployment & Testing Guide

## Quick Start (5 minutes)

### 1. Apply Database Migration
```bash
cd backend
alembic upgrade head
```

### 2. Start Backend
```bash
python -m uvicorn app.main:app --reload
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

### 4. Access Dashboard
```
http://localhost:3000/events/{eventId}/analytics
```

### 5. Test Endpoints
```bash
# Get summary (requires auth)
curl -X GET "http://localhost:8000/analytics/event/{eventId}/summary" \
  -H "X-Tenant-ID: {tenantId}" \
  -H "Authorization: Bearer {token}"
```

## Detailed Setup

### Prerequisites
- Python 3.9+
- Node.js 16+
- SQLite3
- Existing lighthouse database with Phase 5 data

### Step 1: Database Migration

**What it does:** Adds 4 performance indices to the `approval_requests` table.

```bash
cd /root/uniplane-repos/lighthouse/backend

# Check current schema
sqlite3 ../lighthouse.db ".schema approval_requests"

# Apply migration
alembic upgrade head

# Verify indices were created
sqlite3 ../lighthouse.db ".indices"
# Should see:
# idx_approval_requests_event_department
# idx_approval_requests_event_option
# idx_approval_requests_collected_at
# idx_approval_requests_event_collected
```

### Step 2: Backend Setup

**Option A: Fresh Start (Recommended)**
```bash
cd backend

# Stop any running instances
pkill -f "uvicorn app.main:app"

# Start with reload enabled
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Option B: Docker**
```bash
docker-compose up backend
```

**Verify Backend:**
```bash
# Health check
curl http://localhost:8000/

# Should respond with:
# {"message":"Lighthouse backend running","tenant":null}
```

### Step 3: Frontend Setup

**Option A: Development Mode**
```bash
cd frontend

# Install dependencies (if needed)
npm install

# Start dev server
npm run dev
```

**Option B: Production Build**
```bash
cd frontend

# Build
npm run build

# Serve (requires web server)
npm run preview
```

**Verify Frontend:**
```bash
# Should be accessible
curl http://localhost:3000/

# Should see React app
```

## Testing Procedures

### Test 1: Database Indices

```bash
sqlite3 /root/uniplane-repos/lighthouse/lighthouse.db

# Check indices exist
SELECT name FROM sqlite_master 
WHERE type='index' AND tbl_name='approval_requests';

# Should show 4 new indices:
# idx_approval_requests_event_department
# idx_approval_requests_event_option
# idx_approval_requests_collected_at
# idx_approval_requests_event_collected
```

### Test 2: API Endpoints

Create a test script `test_analytics_api.sh`:

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:8000"
TENANT_ID="test-tenant"
EVENT_ID="test-event-001"
TOKEN="your-valid-jwt-token"

echo "Testing Phase 6 Analytics APIs..."
echo "=================================="

# Test 1: Summary Endpoint
echo -e "\n1. Testing /summary endpoint..."
curl -X GET "$BASE_URL/analytics/event/$EVENT_ID/summary" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test 2: Timeline Endpoint
echo -e "\n\n2. Testing /timeline endpoint..."
curl -X GET "$BASE_URL/analytics/event/$EVENT_ID/timeline" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test 3: ROI Endpoint
echo -e "\n\n3. Testing /roi endpoint..."
curl -X GET "$BASE_URL/analytics/event/$EVENT_ID/roi" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test 4: Export Endpoint
echo -e "\n\n4. Testing /export endpoint..."
curl -X POST "$BASE_URL/analytics/event/$EVENT_ID/export" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format": "csv", "type": "summary"}' \
  -o summary_export.csv
echo "Export file saved to summary_export.csv"

# Test 5: Insights Endpoint
echo -e "\n\n5. Testing /insights endpoint..."
curl -X GET "$BASE_URL/analytics/event/$EVENT_ID/insights" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo -e "\n\nAll tests completed!"
```

### Test 3: Frontend Component

1. **Navigate to Analytics Dashboard**
   ```
   http://localhost:3000/events/{eventId}/analytics
   ```

2. **Verify Components Load**
   - [ ] Key metric cards visible (Participation, Budget, Savings, Collected)
   - [ ] Department breakdown section loaded
   - [ ] Options popularity chart rendered
   - [ ] Timeline visualization displayed
   - [ ] Key insights section visible
   - [ ] Export buttons functional

3. **Test Export Functionality**
   - [ ] Click "Executive Summary" dropdown
   - [ ] Select report type (summary, participation, budget, distribution)
   - [ ] Click "Export as CSV" button
   - [ ] File downloads successfully
   - [ ] Verify CSV content (headers, data, formatting)

4. **Browser Console Check**
   ```javascript
   // Open F12 → Console
   // Should see no errors
   // Verify API calls in Network tab
   ```

### Test 4: Authorization

**Positive Test (Should Succeed)**
```bash
# With valid token of TENANT_ADMIN
curl -X GET "http://localhost:8000/analytics/event/test-event/summary" \
  -H "X-Tenant-ID: test-tenant" \
  -H "Authorization: Bearer {valid-admin-token}"

# Response: 200 OK with event summary
```

**Negative Test (Should Fail)**
```bash
# With invalid role (CORPORATE_USER)
curl -X GET "http://localhost:8000/analytics/event/test-event/summary" \
  -H "X-Tenant-ID: test-tenant" \
  -H "Authorization: Bearer {user-token}"

# Response: 403 Forbidden
# {"detail": "Only tenant admin/lead can view analytics"}
```

### Test 5: Tenant Scoping

```bash
# Test 1: Access own tenant event
curl -X GET "http://localhost:8000/analytics/event/event-tenant-a/summary" \
  -H "X-Tenant-ID: tenant-a" \
  -H "Authorization: Bearer {tenant-a-admin-token}"
# Response: 200 OK

# Test 2: Try to access different tenant event
curl -X GET "http://localhost:8000/analytics/event/event-tenant-b/summary" \
  -H "X-Tenant-ID: tenant-a" \
  -H "Authorization: Bearer {tenant-a-admin-token}"
# Response: 403 or 404 (depends on implementation)
```

## Integration with Existing Flows

### Event Creation Flow
1. Create event (Phase 3)
2. Create event options (Phase 3)
3. Invite guests & manage approvals (Phase 4)
4. Run QR scanner on event day (Phase 5)
5. **NEW:** View analytics post-event (Phase 6)

### Complete Data Flow Example

```sql
-- 1. Create event
INSERT INTO events (id, event_name, event_date, event_type, event_budget_amount)
VALUES ('evt-001', 'Summer Celebration', '2026-01-27', 'GIFTING', 500000);

-- 2. Create options
INSERT INTO event_options (id, event_id, option_name, max_budget_per_option)
VALUES 
  ('opt-001', 'evt-001', 'Coffee Voucher', 50000),
  ('opt-002', 'evt-001', 'Wellness Kit', 200000);

-- 3. Create users and approvals
INSERT INTO approval_requests (id, event_id, user_id, option_id, is_approved)
VALUES 
  ('apr-001', 'evt-001', 'usr-001', 'opt-001', 1),
  ('apr-002', 'evt-001', 'usr-002', 'opt-002', 1);

-- 4. Scanner collects gifts (Phase 5)
UPDATE approval_requests SET 
  is_collected = 1, 
  collected_at = datetime('now'), 
  collected_by = 'admin-001'
WHERE id = 'apr-001';

-- 5. Analytics queries (Phase 6)
SELECT * FROM events WHERE id = 'evt-001';
-- → Event summary with participation, budget, performance metrics
```

## Performance Testing

### Load Test Setup
```bash
# Install Apache Bench
apt-get install apache2-utils

# Test summary endpoint with 100 requests, 10 concurrent
ab -n 100 -c 10 \
  -H "X-Tenant-ID: test-tenant" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/analytics/event/test-event/summary

# Expected: All requests under 500ms
```

### Database Query Performance
```bash
# Enable query timing in SQLite
sqlite3 lighthouse.db

-- Time a summary query
.timer on
SELECT COUNT(*) FROM approval_requests WHERE event_id = 'evt-001';

-- Should complete in < 100ms
```

## Monitoring & Logging

### Backend Logs

Check for errors after migration:
```bash
# Backend console should show no errors
# Look for "Uvicorn running on http://0.0.0.0:8000"
```

### Database Logs

Verify indices are being used:
```bash
# Enable EXPLAIN QUERY PLAN
sqlite3 lighthouse.db

.mode line
EXPLAIN QUERY PLAN
SELECT * FROM approval_requests 
WHERE event_id = 'evt-001' AND is_collected = 1;

-- Should show index usage:
-- SEARCH approval_requests USING idx_approval_requests_event_collected
```

### Frontend Errors

Open browser DevTools (F12):
- **Console Tab:** Should show no JS errors
- **Network Tab:** Verify API calls succeed (200 OK)
- **Performance Tab:** Measure page load time (target < 2s)

## Verification Checklist

### Pre-Deployment
- [ ] All Phase 6 files exist in correct locations
- [ ] Database migration file present (0020_add_analytics_indices.py)
- [ ] event_analytics router imported in main.py
- [ ] event_analytics router registered in main.py
- [ ] No syntax errors in Python files
- [ ] No syntax errors in React components

### Post-Deployment
- [ ] Database migration applied successfully
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] All 5 API endpoints respond (curl tests)
- [ ] AnalyticsDashboard loads without errors
- [ ] Export downloads CSV files
- [ ] Authorization enforced (403 for non-admin)
- [ ] Tenant scoping works (cross-tenant prevented)
- [ ] Performance acceptable (< 500ms response time)
- [ ] Logs clean (no errors or warnings)

### Functional Testing
- [ ] Summary shows all metric categories
- [ ] Timeline has hourly data (if event has collections)
- [ ] ROI calculates correct savings
- [ ] Insights generated with recommendations
- [ ] Export produces valid CSV files
- [ ] Department breakdown matches database counts
- [ ] Budget numbers reconcile with approvals
- [ ] Participation rates calculated correctly

## Rollback Plan

If issues occur:

```bash
# 1. Rollback database
cd backend
alembic downgrade -1

# 2. Revert main.py
git checkout app/main.py

# 3. Remove Phase 6 files
rm app/api/event_analytics.py
rm app/services/analytics_service.py
rm app/services/report_service.py
rm app/schemas/analytics.py
rm ../frontend/src/components/AnalyticsDashboard.jsx
rm migrations/versions/0020_add_analytics_indices.py

# 4. Restart
pkill -f uvicorn
python -m uvicorn app.main:app --reload
```

## Support & Troubleshooting

See detailed troubleshooting in [PHASE_6_INTEGRATION.md](PHASE_6_INTEGRATION.md)

Common issues:
1. **Migration fails** → Check database write permissions
2. **API returns 404** → Verify event_id is correct
3. **API returns 403** → Check user role is TENANT_ADMIN/LEAD
4. **API returns 500** → Check logs, may need AnalyticsService import
5. **Frontend stuck loading** → Check browser console, verify API endpoint
6. **Export fails** → Verify ReportService is imported correctly
7. **No metrics shown** → Event may have no approvals/collections
8. **Slow performance** → Indices may not be applied, check migration

## Example Test Data

For manual testing, create sample event:

```bash
# Using Python REPL
python3

from app.db.database import SessionLocal
from app.models.events import Event
from app.models.approval_requests import ApprovalRequest
from datetime import datetime

db = SessionLocal()

# Create test event
event = Event(
    id="test-evt-001",
    event_name="Test Event",
    event_date="2026-01-27",
    event_type="GIFTING",
    event_budget_amount=500000,
    tenant_id="test-tenant"
)
db.add(event)

# Create test approvals (with collections)
for i in range(10):
    approval = ApprovalRequest(
        id=f"apr-{i:03d}",
        event_id="test-evt-001",
        user_id=f"usr-{i:03d}",
        option_id="opt-001",
        is_approved=True,
        is_collected=1,
        collected_at=datetime(2026, 1, 27, 10+i//4, 30),
        collected_by="admin-001",
        budget_committed=42000
    )
    db.add(approval)

db.commit()
```

Then test:
```bash
curl http://localhost:8000/analytics/event/test-evt-001/summary
```

## Next Steps After Deployment

1. **Monitor** - Check logs for errors in first 24 hours
2. **Train Users** - Demo analytics dashboard to tenant admins
3. **Gather Feedback** - What additional metrics would be useful?
4. **Plan Next Phase** - What features would improve ROI tracking?

## Success Criteria

✅ Phase 6 is successfully deployed when:
- All database indices created
- All 5 API endpoints working
- Frontend dashboard accessible and loading
- CSV exports downloading correctly
- Authorization enforced
- Tenant scoping verified
- Performance < 500ms for all endpoints
- No errors in logs
- Users can view event analytics and export reports

## Documentation References

- **Main Spec:** PHASE_6_POST_EVENT_ANALYTICS.md
- **Setup Guide:** PHASE_6_INTEGRATION.md
- **Quick Ref:** PHASE_6_INDEX.md
- **Files List:** PHASE_6_FILES.md
- **This Guide:** Deployment & Testing Guide

## Questions?

Refer to relevant documentation:
- **"How do I...?"** → PHASE_6_INDEX.md (Quick Reference)
- **"How do I set up...?"** → PHASE_6_INTEGRATION.md (Setup Guide)
- **"What does this feature do...?"** → PHASE_6_POST_EVENT_ANALYTICS.md (Main Spec)
- **"Where's the file for...?"** → PHASE_6_FILES.md (Files Manifest)
