# Phase 6 Quick Reference

## Key Facts
- **Phase Name:** Post-Event Analytics & Reporting
- **Purpose:** Prove event ROI and provide actionable insights
- **Timeline:** Complete end-to-end after Phase 5 (Scanner)
- **Authorization:** TENANT_ADMIN or TENANT_LEAD only

## What Users Can Do

### Tenant Admins
1. View event summary with all key metrics
2. Compare department participation (e.g., "94% Engineering vs 60% Sales")
3. See budget reconciliation (spent vs saved)
4. Export comprehensive reports as CSV
5. Get AI-generated insights and recommendations

## Endpoints At A Glance

| Method | Endpoint | Purpose | Response |
|--------|----------|---------|----------|
| GET | `/analytics/event/{id}/summary` | All metrics combined | EventSummary |
| GET | `/analytics/event/{id}/timeline` | Hourly collection breakdown | TimelineData |
| GET | `/analytics/event/{id}/roi` | ROI metrics (savings, cost/participant) | RoiMetrics |
| POST | `/analytics/event/{id}/export` | Export analytics as CSV | CSV file |
| GET | `/analytics/event/{id}/insights` | Auto-generated insights | JSON with insights list |

## Key Metrics Explained

### Participation Rate
- **Formula:** (Total Collected / Total Approved) × 100
- **Example:** 94/100 = 94% attended
- **By Department:** Shows which departments engaged most

### Budget Utilization
- **Formula:** (Budget Committed / Total Budget) × 100
- **Example:** ₹4.2L / ₹5L = 84% utilized
- **Savings:** ₹5L - ₹4.2L = ₹80k saved

### Cost Per Participant
- **Formula:** Budget Committed / Total Collected
- **Example:** ₹4,20,000 / 94 = ₹4,468 per person

### Department Attendance Rate
- **Formula:** (Department Attended / Department Registered) × 100
- **Example:** Engineering 47/50 = 94% | Sales 18/30 = 60%

## File Structure

```
backend/
  app/
    api/
      event_analytics.py          ← REST API (5 endpoints)
    services/
      analytics_service.py        ← Core calculations
      report_service.py          ← CSV/PDF generation
    schemas/
      analytics.py               ← Pydantic models
  migrations/
    versions/
      0020_add_analytics_indices.py ← Database indices

frontend/
  src/components/
    AnalyticsDashboard.jsx       ← Main dashboard UI
```

## Data Model

```
Event (name, date, type, budget)
  ↓
Approvals (user, option, budget, is_collected, collected_at, collected_by)
  ↓
Analytics Aggregation:
  - By Department (grouping via user.department)
  - By Option (grouping via approval.option_id)
  - By Hour (binning collected_at timestamps)
  ↓
Reports (CSV export)
```

## Typical User Flow

1. **Post-Event:** Admin views analytics dashboard
2. **Gets instant insight:** "94% participation, ₹80k saved, Sales needs follow-up"
3. **Exports CSV:** For sharing with stakeholders
4. **Takes action:** Follows recommendations (e.g., expand popular options)
5. **Plans next event:** Uses historical data

## Common Scenarios

### Scenario 1: Proving ROI to Finance
1. Get ROI metrics endpoint
2. Show budget_saved and savings_percentage
3. Export summary CSV for documentation

### Scenario 2: Improving Attendance
1. View participation by department
2. See Sales is only 60% (vs Engineering 94%)
3. Get recommendation to "schedule follow-up with Sales"
4. Use data in next event planning

### Scenario 3: Optimizing Staffing
1. View timeline data (hourly breakdown)
2. See peak time is 14:00 (32 collections/hour)
3. Allocate more scanners for that window next time

### Scenario 4: Understanding Preferences
1. View options by attendance rate
2. See "Standup Comedy" highest registration
3. Expand this option in future events

## Accessing the Dashboard

### Via Frontend
```
http://localhost:3000/events/{eventId}/analytics
```

### Via API (Curl)
```bash
curl -X GET "http://localhost:8000/analytics/event/evt-001/summary" \
  -H "X-Tenant-ID: tenant-001" \
  -H "Authorization: Bearer {token}"
```

## Export Report Types

| Type | Contents | Use Case |
|------|----------|----------|
| **summary** | All metrics in one CSV | Executive overview |
| **participation** | Dept breakdown with attendance | HR follow-up |
| **budget** | Budget by option with spend | Finance audit |
| **distribution** | Full collection log with timestamps | Full accountability |

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | Success | Check response data |
| 403 | Access denied | User must be TENANT_ADMIN/LEAD |
| 404 | Event not found | Verify event_id is correct |
| 500 | Server error | Check logs, may need migration |

## Performance Targets

| Endpoint | Expected Time | Notes |
|----------|---------------|-------|
| `/summary` | < 500ms | Fetches all metrics |
| `/timeline` | < 500ms | Hourly data only |
| `/roi` | < 500ms | Calculated from summary |
| `/export` | < 1s | Generates CSV file |
| `/insights` | < 500ms | Generated from other queries |

## Database Requirements

- Indices added by migration 0020
- No new tables created
- Uses existing: events, approval_requests, users, event_options

## Typical Metrics Values

For a 100-person event:
- **Participation Rate:** 85-95% typical
- **Budget Utilization:** 80-95% typical
- **Department Range:** 60-95% (varies by dept)
- **Cost Per Person:** ₹4,000-₹5,000 typical
- **Budget Saved:** 5-20% of total

## Useful Queries

### Check if event has collections
```sql
SELECT COUNT(*) from approval_requests 
WHERE event_id = 'evt-001' AND is_collected = 1;
```

### Participation by department
```sql
SELECT u.department, COUNT(*) total, SUM(a.is_collected) attended
FROM approval_requests a
JOIN users u ON a.user_id = u.id
WHERE a.event_id = 'evt-001'
GROUP BY u.department;
```

### Budget summary
```sql
SELECT eo.option_name, SUM(ar.budget_committed) spent
FROM approval_requests ar
JOIN event_options eo ON ar.option_id = eo.id
WHERE ar.event_id = 'evt-001'
GROUP BY eo.option_name;
```

### Collections by hour
```sql
SELECT STRFTIME('%H:00', ar.collected_at) hour, COUNT(*) collections
FROM approval_requests ar
WHERE ar.event_id = 'evt-001' AND ar.is_collected = 1
GROUP BY STRFTIME('%H:00', ar.collected_at)
ORDER BY hour;
```

## Next Steps

1. ✅ Migrate database (`alembic upgrade head`)
2. ✅ Start backend (`python -m uvicorn app.main:app`)
3. ✅ Start frontend (`npm run dev`)
4. 📊 View dashboard (`http://localhost:3000/events/{id}/analytics`)
5. 📥 Export reports
6. 🎯 Act on insights

## Feature Checklist

- [x] Event summary with all metrics
- [x] Participation metrics by department and option
- [x] Budget reconciliation and savings calculation
- [x] ROI metrics (cost per participant)
- [x] Timeline analysis (hourly breakdown)
- [x] Performance tracking (top performers/distribution log)
- [x] CSV exports (4 types)
- [x] Auto-generated insights
- [x] Dashboard UI with charts
- [x] Authorization and tenant scoping

## Known Limitations

1. **PDF Export** - Not implemented (text-based only)
2. **Real-time Updates** - Dashboard requires manual refresh
3. **Caching** - No caching (each request queries DB)
4. **Comparison** - Can't compare two events yet
5. **Scheduling** - Exports must be manual (no email)

## Related Phases

- **Phase 4:** Approval governance (creates the approvals)
- **Phase 5:** Scanner (collects the gifts and sets timestamps)
- **Phase 6:** Analytics (this phase - reports on results)

## Documentation

- Full spec: [PHASE_6_POST_EVENT_ANALYTICS.md](PHASE_6_POST_EVENT_ANALYTICS.md)
- Setup guide: [PHASE_6_INTEGRATION.md](PHASE_6_INTEGRATION.md)
- This file: Quick reference

## Support & Questions

### Getting Analytics Data
- Use `/analytics/event/{id}/summary` for all data
- Use specific endpoints for individual metrics
- Use `/export` for reports

### Troubleshooting
- Check authorization (TENANT_ADMIN/LEAD required)
- Check event exists and has approvals
- Check collection data is set (is_collected=1)
- See PHASE_6_INTEGRATION.md for detailed troubleshooting

### Common Issues
- **No data:** Event may have no approvals yet
- **Access denied:** User role insufficient
- **Export fails:** Check AnalyticsService imports
- **Frontend stuck:** Check browser console for fetch errors
