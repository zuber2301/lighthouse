# Phase 6 Integration Guide

## Setup Instructions

### 1. Apply Database Migration

```bash
cd backend
alembic upgrade head
```

This will:
- Add performance indices for analytics queries
- Optimize grouping by department, option, and timeline

Verify migration applied:
```bash
sqlite3 lighthouse.db ".schema approval_requests"
# Should show indices: idx_approval_requests_event_department, idx_approval_requests_event_option, etc.
```

### 2. Install Frontend Dependencies

No new dependencies required! All components use:
- React (existing)
- TailwindCSS (existing)
- lucide-react (existing for icons)
- Fetch API (native browser)

### 3. Register Analytics Router

The import is already added to `app/main.py`:
```python
from app.api import ... event_analytics
app.include_router(event_analytics.router)
```

Verify registration:
```bash
# Check main.py includes event_analytics
grep "event_analytics" backend/app/main.py
```

### 4. Start Services

Backend:
```bash
cd backend
python -m uvicorn app.main:app --reload
```

Frontend:
```bash
cd frontend
npm run dev
```

## API Testing

### 1. Test Summary Endpoint

```bash
curl -X GET "http://localhost:8000/analytics/event/{event_id}/summary" \
  -H "X-Tenant-ID: {tenant_id}" \
  -H "Authorization: Bearer {auth_token}"
```

Expected Response (200 OK):
```json
{
  "event_id": "evt-001",
  "event_name": "Summer Celebration",
  "event_date": "2026-01-27",
  "event_type": "GIFTING",
  "total_approved": 100,
  "total_collected": 94,
  "participation_rate": 94.0,
  "budget": {
    "total_budget": 500000.0,
    "budget_committed": 420000.0,
    "budget_remaining": 80000.0,
    "budget_utilization": 84.0
  },
  "participation": {...},
  "performance": {...}
}
```

### 2. Test Timeline Endpoint

```bash
curl -X GET "http://localhost:8000/analytics/event/{event_id}/timeline" \
  -H "X-Tenant-ID: {tenant_id}" \
  -H "Authorization: Bearer {auth_token}"
```

Expected Response (200 OK):
```json
{
  "event_id": "evt-001",
  "timeline": [
    {"hour": "09:00", "collections": 2, "cumulative": 2},
    {"hour": "10:00", "collections": 8, "cumulative": 10},
    {"hour": "11:00", "collections": 15, "cumulative": 25},
    ...
  ]
}
```

### 3. Test ROI Endpoint

```bash
curl -X GET "http://localhost:8000/analytics/event/{event_id}/roi" \
  -H "X-Tenant-ID: {tenant_id}" \
  -H "Authorization: Bearer {auth_token}"
```

Expected Response (200 OK):
```json
{
  "total_budget": 500000.0,
  "actual_spend": 420000.0,
  "savings": 80000.0,
  "savings_percentage": 16.0,
  "participation_rate": 94.0,
  "cost_per_participant": 4468.09,
  "event_type": "GIFTING"
}
```

### 4. Test Export Endpoint

```bash
curl -X POST "http://localhost:8000/analytics/event/{event_id}/export" \
  -H "X-Tenant-ID: {tenant_id}" \
  -H "Authorization: Bearer {auth_token}" \
  -H "Content-Type: application/json" \
  -d '{"format": "csv", "type": "summary"}' \
  -o summary.csv
```

Expected: Downloads CSV file with analytics data

### 5. Test Insights Endpoint

```bash
curl -X GET "http://localhost:8000/analytics/event/{event_id}/insights" \
  -H "X-Tenant-ID: {tenant_id}" \
  -H "Authorization: Bearer {auth_token}"
```

Expected Response (200 OK):
```json
{
  "event_id": "evt-001",
  "insights": [
    "Engineering: 94% participation (47/50) - Excellent!",
    "Sales: 60% participation (18/30) - Needs attention",
    "Budget saved: ₹80,000 (16% savings)",
    "Most popular: Standup Comedy (25 registrations)",
    "Peak time: 14:00 (32 gifts collected)"
  ],
  "recommendations": [
    "Schedule follow-up with Sales team",
    "Expand Standup Comedy next time",
    "Allocate more scanners during 14:00 window"
  ],
  "summary": {
    "total_approved": 100,
    "total_collected": 94,
    "participation_rate": 94.0,
    "budget_spent": 420000.0,
    "budget_saved": 80000.0
  }
}
```

## Frontend Integration

### 1. Add Route

Edit `frontend/src/App.jsx` or router config:

```jsx
import AnalyticsDashboard from './components/AnalyticsDashboard';

// Add route
<Route path="/events/:eventId/analytics" element={<AnalyticsDashboard />} />
```

### 2. Add Navigation Link

```jsx
<Link to={`/events/${eventId}/analytics`} className="btn btn-primary">
  View Analytics
</Link>
```

### 3. Component Usage

```jsx
import AnalyticsDashboard from './components/AnalyticsDashboard';

function EventDetails() {
  const { eventId } = useParams();
  
  return <AnalyticsDashboard eventId={eventId} />;
}
```

## Troubleshooting

### 1. "Only tenant admin/lead can view analytics" Error

**Issue:** User gets 403 Forbidden

**Solution:** 
- Verify user role is TENANT_ADMIN or TENANT_LEAD
- Check role assignment in database
- Verify X-Tenant-ID header matches user's tenant

```sql
SELECT id, role, tenant_id FROM users WHERE email = '{user_email}';
```

### 2. Summary Returns Empty Metrics

**Issue:** All zero values in response

**Solution:**
- Check event exists: `SELECT * FROM events WHERE id = '{event_id}';`
- Check approvals exist: `SELECT COUNT(*) FROM approval_requests WHERE event_id = '{event_id}';`
- Check collection data: `SELECT COUNT(*) FROM approval_requests WHERE event_id = '{event_id}' AND is_collected = 1;`
- Verify collected_at timestamps are set

```sql
SELECT event_id, COUNT(*) total, SUM(is_collected) collected FROM approval_requests 
WHERE event_id = '{event_id}' GROUP BY event_id;
```

### 3. Export Returns 500 Error

**Issue:** Export endpoint crashes

**Solution:**
- Check service logs for specific error
- Verify AnalyticsService imports: `from app.services.analytics_service import AnalyticsService`
- Verify ReportService imports: `from app.services.report_service import ReportService`
- Verify database connection working

### 4. Frontend Shows "Loading Analytics..." Forever

**Issue:** Analytics dashboard stuck loading

**Solution:**
- Check browser console for fetch errors
- Verify API endpoint URL is correct
- Check CORS headers: `Access-Control-Allow-Origin`
- Verify auth token is valid and sent in request

```javascript
// Check browser console
fetch('/api/analytics/event/evt-001/summary')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e));
```

### 5. Timeline Shows No Data

**Issue:** Timeline chart is empty

**Solution:**
- Check approvals have collected_at timestamps
- Verify timestamp format (should be ISO 8601 datetime)
- Check that is_collected = 1 for entries with timestamps

```sql
SELECT COUNT(*) with_timestamp, COUNT(CASE WHEN collected_at IS NULL THEN 1 END) null_timestamp 
FROM approval_requests WHERE event_id = '{event_id}' AND is_collected = 1;
```

### 6. Participation Rates Don't Match Manual Count

**Issue:** Math doesn't add up

**Solution:**
- Verify count by department manually
- Check for duplicate user IDs in approvals
- Ensure is_collected flag is correct

```sql
SELECT department, COUNT(*) total, SUM(is_collected) collected 
FROM approval_requests a
JOIN users u ON a.user_id = u.id
WHERE a.event_id = '{event_id}'
GROUP BY department;
```

## Performance Tuning

### 1. Database Query Performance

Check if indices are being used:

```bash
# Enable query timing
sqlite3 lighthouse.db
sqlite> .timer on

# Run sample analytics query
SELECT event_id, COUNT(*) FROM approval_requests 
WHERE event_id = 'evt-001' AND is_collected = 1
GROUP BY event_id;
```

If slow, check indices:
```sql
SELECT * FROM sqlite_master WHERE type='index' AND tbl_name='approval_requests';
```

### 2. API Response Time

Monitor in browser:
```javascript
// Add timing to analytics fetch
const start = performance.now();
const res = await fetch('/api/analytics/event/evt-001/summary');
const time = performance.now() - start;
console.log(`Analytics fetch took ${time}ms`);
```

Target: < 500ms for summary endpoint

### 3. Frontend Rendering

Use React DevTools to check:
- Component render count
- Unnecessary re-renders
- Component update performance

```javascript
// Log render count
let renderCount = 0;
function AnalyticsDashboard() {
  console.log(`Render #${++renderCount}`);
  // ...
}
```

## Monitoring & Debugging

### 1. Enable API Logging

In `backend/app/api/event_analytics.py`, add logging:

```python
import logging
logger = logging.getLogger(__name__)

@router.get("/{event_id}/summary")
async def get_event_summary(...):
    logger.info(f"Getting summary for event {event_id}")
    result = await service.get_event_summary(...)
    logger.info(f"Summary result: {result}")
    return ...
```

### 2. Check Service Logs

```bash
# Backend logs
tail -f backend/app.log

# Frontend browser console
F12 → Console tab
```

### 3. Database Inspection

```bash
sqlite3 lighthouse.db

# Check event exists
SELECT * FROM events WHERE id = 'evt-001';

# Check approvals
SELECT COUNT(*) FROM approval_requests WHERE event_id = 'evt-001';

# Check collection status
SELECT is_collected, COUNT(*) FROM approval_requests 
WHERE event_id = 'evt-001' GROUP BY is_collected;

# Check timeline data
SELECT DATE(collected_at) date, COUNT(*) FROM approval_requests
WHERE event_id = 'evt-001' AND is_collected = 1 GROUP BY DATE(collected_at);
```

## API Contract Reference

### Authorization
All endpoints require:
- `X-Tenant-ID` header
- `Authorization: Bearer {token}` header
- User role: TENANT_ADMIN or TENANT_LEAD

### Request/Response Format
- Request: JSON with `Content-Type: application/json`
- Response: JSON or CSV depending on endpoint

### Error Responses

404 Not Found:
```json
{"detail": "Event not found"}
```

403 Forbidden:
```json
{"detail": "Only tenant admin/lead can view analytics"}
```

500 Internal Error:
```json
{"detail": "Internal server error"}
```

### Rate Limiting
None currently. Can be added in future if needed.

## Deployment Checklist

- [ ] Database migration applied (`alembic upgrade head`)
- [ ] Backend services restarted
- [ ] Frontend built (`npm run build`)
- [ ] Analytics router registered in app/main.py
- [ ] All 5 endpoints responding (curl tests passed)
- [ ] Frontend dashboard accessible and loading
- [ ] Export functionality downloads CSV files
- [ ] Authorization enforced (non-admin rejected)
- [ ] Tenant scoping verified (cross-tenant access prevented)
- [ ] Logs monitored for errors
- [ ] Performance acceptable (< 500ms response time)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review logs in backend and browser console
3. Verify database migration applied
4. Test with curl/Postman before blaming frontend
5. Check tenant_id and authorization token are correct
