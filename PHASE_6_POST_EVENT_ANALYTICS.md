# Phase 6: Post-Event Analytics & Reporting

## Overview

Phase 6 closes the loop on event management by providing comprehensive post-event analytics and ROI reporting. This phase delivers actionable insights through three key lenses:

1. **Participation Insights** - Department-level registration vs attendance tracking
2. **Budget Reconciliation** - Total budget vs actual spend with savings calculation
3. **Performance Tracking** - Event-specific reporting (winners for Annual Day, distribution logs for Gifting)

## Business Goals

**For Tenant Admins:**
- Prove ROI of the event by showing budget savings and participation rates
- Compare department engagement (e.g., "94% Engineering vs 60% Sales")
- Export comprehensive reports for stakeholder communication
- Understand peak demand times for better event planning

**For Finance Teams:**
- Reconcile event budgets vs actual spending
- Track spending by gift/track option
- Generate audit trails with timestamps
- Calculate cost per participant

**For Event Organizers:**
- Identify low-participation departments for follow-up
- Understand which options were most popular
- Plan improvements based on collection timeline data

## Key Features

### 1. Event Summary Dashboard
Complete post-event overview combining:
- Participation metrics (registered, attended, rate %)
- Budget reconciliation (total, committed, remaining, utilization %)
- Performance metrics (collection status and distribution)
- Timeline analysis (hourly breakdown)

### 2. Participation Analytics
**By Department:**
- Department name
- Total registered
- Total attended
- Attendance rate (%)
- List of participants

**By Track/Option:**
- Option name
- Total registered
- Total attended
- Attendance rate (%)

**Overall:**
- Total registered
- Total attended
- Overall attendance rate (%)

### 3. Budget Reconciliation
**Summary Level:**
- Total Event Budget: ₹5,00,000
- Budget Committed: ₹4,20,000 (actual spending)
- Budget Remaining: ₹80,000 (savings)
- Budget Utilization: 84%

**By Option/Gift:**
- Option name
- Allocated budget
- Amount spent
- Remaining budget
- Utilization %

**ROI Metrics:**
- Total budget
- Actual spend
- Savings amount
- Savings percentage
- Participation rate
- Cost per participant

### 4. Performance Tracking
**For ANNUAL_DAY events:**
- Top performers ranked by collection order
- User name, department, option, timestamp

**For GIFTING events:**
- Complete distribution log
- User, email, department, gift option, status, timestamps

**Collection Status:**
- Total collected
- Not yet collected
- Collection rate

### 5. Timeline Analysis
Hourly breakdown showing:
- Hour of day
- Number of collections in that hour
- Cumulative collections up to that hour

Helps optimize staffing and identify peak demand times.

### 6. Exportable Reports

**Report Types:**
- **Executive Summary** - All metrics in one CSV
- **Participation Report** - Department breakdown with attendance
- **Budget Report** - Budget details by option
- **Distribution Log** - Complete collection history with timestamps

**Format:** CSV (easy to open in Excel, Google Sheets)
- UTF-8 encoded
- Proper column headers
- Formatted numbers (₹ currency, % for rates)

### 7. Key Insights & Recommendations
Auto-generated insights including:
- Department participation analysis
- Budget savings achieved
- Most popular options
- Peak collection times
- Follow-up recommendations

## Architecture

### Backend Services

**AnalyticsService** (`services/analytics_service.py`)
- `get_event_summary()` - Fetch all metrics
- `_get_budget_metrics()` - Budget calculations
- `_get_participation_metrics()` - Department/option breakdown
- `_get_performance_metrics()` - Winners/distribution logs
- `get_timeline_data()` - Hourly collection analysis

**ReportService** (`services/report_service.py`)
- `generate_participation_csv()` - Department attendance CSV
- `generate_distribution_csv()` - Full distribution log CSV
- `generate_budget_csv()` - Budget reconciliation CSV
- `generate_summary_csv()` - Executive summary CSV
- `generate_pdf_report()` - Text-based PDF report

### API Endpoints

```
GET  /analytics/event/{event_id}/summary      → EventSummary
GET  /analytics/event/{event_id}/timeline     → TimelineData
GET  /analytics/event/{event_id}/roi          → RoiMetrics
POST /analytics/event/{event_id}/export       → CSV file download
GET  /analytics/event/{event_id}/insights     → Key insights + recommendations
```

**Authorization:** TENANT_ADMIN or TENANT_LEAD role required

### Frontend Components

**AnalyticsDashboard** (`components/AnalyticsDashboard.jsx`)
- Key metric cards (participation, budget, savings, collected)
- Department participation bar charts
- Options popularity breakdown
- Collection timeline chart
- Key insights section with recommendations
- Export buttons for each report type

### Database

No new tables required. Uses existing:
- `events` - Event metadata
- `approval_requests` - Guest approvals with collection data
  - `is_collected` (0/1)
  - `collected_at` (DateTime)
  - `collected_by` (FK to users)
- `users` - User data (for department grouping)
- `event_options` - Track/gift options

**New Indices (Migration 0020):**
- `idx_approval_requests_event_department` - Speedup participation aggregation
- `idx_approval_requests_event_option` - Speedup budget by option
- `idx_approval_requests_collected_at` - Speedup timeline queries
- `idx_approval_requests_event_collected` - Speedup collection status filtering

## Data Flow

### 1. Event Scan & Collection (Phase 5)
- Admin scans QR code → `approval_requests.is_collected = 1`
- System records `collected_at` timestamp
- System records `collected_by` (which admin)

### 2. Analytics Calculation (Phase 6)
- Query all approvals for event
- Group by department, option
- Calculate participation rates
- Sum budget spent vs allocated
- Build hourly timeline from timestamps
- Generate performance rankings

### 3. Report Generation
- Call analytics service to get metrics
- Format as CSV/PDF
- Stream to client for download

## Example Responses

### Event Summary
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
  "participation": {
    "by_department": [
      {
        "department": "Engineering",
        "registered": 50,
        "attended": 47,
        "attendance_rate": 94.0
      },
      {
        "department": "Sales",
        "registered": 30,
        "attended": 18,
        "attendance_rate": 60.0
      }
    ]
  }
}
```

### ROI Metrics
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

### Key Insights
```json
{
  "event_id": "evt-001",
  "insights": [
    "Engineering: 94% participation (47/50) - Excellent!",
    "Sales: 60% participation (18/30) - Needs attention",
    "Budget saved: ₹80,000 (16% savings)",
    "Most popular: Standup Comedy (25 registrations)",
    "Peak collection: 14:00 (32 gifts/hour)"
  ],
  "recommendations": [
    "Schedule follow-up with Sales team",
    "Expand Standup Comedy next time",
    "Optimize staffing for 2pm-3pm window"
  ]
}
```

## Usage Examples

### Get Event Summary
```bash
curl -X GET "http://localhost:8000/analytics/event/evt-001/summary" \
  -H "X-Tenant-ID: tenant-001" \
  -H "Authorization: Bearer {token}"
```

### Export Participation Report
```bash
curl -X POST "http://localhost:8000/analytics/event/evt-001/export" \
  -H "X-Tenant-ID: tenant-001" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"format": "csv", "type": "participation"}' \
  -o participation_report.csv
```

### Get Timeline Data
```bash
curl -X GET "http://localhost:8000/analytics/event/evt-001/timeline" \
  -H "X-Tenant-ID: tenant-001" \
  -H "Authorization: Bearer {token}"
```

## Metrics Definitions

**Participation Rate** = (Total Collected / Total Approved) × 100

**Budget Utilization** = (Budget Committed / Total Budget) × 100

**Budget Savings** = Total Budget - Budget Committed

**Cost Per Participant** = Budget Committed / Total Collected

**Department Attendance Rate** = (Department Attended / Department Registered) × 100

**Option Attendance Rate** = (Option Attended / Option Registered) × 100

## Performance Considerations

1. **Query Optimization**
   - Analytics queries use indices for fast filtering
   - Grouping logic in Python (not DB) for flexibility
   - All queries are read-only (no locks)

2. **Caching** (Future Enhancement)
   - Cache event summaries for 1 hour
   - Invalidate on new collection
   - Reduces database load

3. **Export Performance**
   - CSV generation in memory (StringIO)
   - Stream response to client
   - No temporary file storage needed

## Security

1. **Authorization**
   - TENANT_ADMIN or TENANT_LEAD required
   - Tenant-scoped queries (cannot see other tenant events)

2. **Data Privacy**
   - All user data exported (consider PII)
   - CSV files contain email, department
   - Should be downloaded securely

3. **Audit Trail**
   - All collections recorded with timestamps
   - Admin who collected is recorded
   - Enables full accountability

## Future Enhancements

1. **Charts & Visualizations**
   - Department participation pie charts
   - Budget breakdown charts
   - Timeline line graphs

2. **Advanced Filtering**
   - Filter by date range
   - Filter by department
   - Filter by option/track

3. **Predictive Analytics**
   - Predict attendance for future events
   - Recommend budget allocation
   - Suggest popular options

4. **Comparison Reports**
   - Compare two events side-by-side
   - Historical trends across events
   - Department participation trends

5. **PDF Reports**
   - Auto-generated PDF with branding
   - Include charts and visualizations
   - Email delivery option

6. **Real-time Insights**
   - Dashboard updates during event
   - Live participation tracking
   - Peak time notifications

## Files Created

### Backend
- `backend/app/services/analytics_service.py` - Core analytics logic
- `backend/app/services/report_service.py` - Report generation
- `backend/app/schemas/analytics.py` - Pydantic validation models
- `backend/app/api/event_analytics.py` - REST API endpoints
- `backend/migrations/versions/0020_add_analytics_indices.py` - Database migration

### Frontend
- `frontend/src/components/AnalyticsDashboard.jsx` - Main dashboard component

### Configuration
- `backend/app/main.py` - Router registration

## Testing

### Manual Testing Checklist
- [ ] GET /analytics/event/{id}/summary returns all metrics
- [ ] Participation rates calculated correctly
- [ ] Budget calculations match spreadsheet
- [ ] Department breakdown includes all users
- [ ] Timeline has all collection hours
- [ ] Export CSV downloads correctly
- [ ] Insights generated for all departments
- [ ] Authorization enforced (non-admin rejected)
- [ ] Tenant scoping works (cross-tenant access prevented)

### Example Test Event
```sql
-- Create test event
INSERT INTO events (id, tenant_id, event_name, event_date, event_type, event_budget_amount)
VALUES ('evt-001', 'tenant-001', 'Summer Celebration', '2026-01-27', 'GIFTING', 500000);

-- Create test options
INSERT INTO event_options (id, event_id, option_type, option_name, max_budget_per_option)
VALUES 
  ('opt-001', 'evt-001', 'GIFT', 'Coffee Voucher', 50000),
  ('opt-002', 'evt-001', 'GIFT', 'Wellness Kit', 200000),
  ('opt-003', 'evt-001', 'GIFT', 'Standup Comedy', 150000);

-- Create test approvals
INSERT INTO approval_requests (id, event_id, user_id, option_id, is_collected, collected_at, collected_by)
VALUES 
  ('apr-001', 'evt-001', 'usr-001', 'opt-002', 1, datetime('2026-01-27 10:30:00'), 'admin-001'),
  ('apr-002', 'evt-001', 'usr-002', 'opt-001', 1, datetime('2026-01-27 10:45:00'), 'admin-001'),
  ('apr-003', 'evt-001', 'usr-003', 'opt-003', 0, NULL, NULL);
```

## Deployment Notes

1. **Database Migration**
   ```bash
   alembic upgrade head
   ```

2. **Frontend Build**
   ```bash
   npm run build
   ```

3. **Backend Restart**
   ```bash
   python -m uvicorn app.main:app --reload
   ```

4. **Test Endpoints**
   ```bash
   curl http://localhost:8000/analytics/event/evt-001/summary
   ```

## Support & Troubleshooting

**Q: Summary returns empty metrics**
A: Ensure event has approvals with `is_collected=1`. Check collection timestamps are set.

**Q: Export fails with 403 error**
A: User must have TENANT_ADMIN or TENANT_LEAD role. Check role assignment.

**Q: Timeline shows no data**
A: Ensure some approvals have `collected_at` timestamps set during event.

**Q: Participation rates don't match**
A: Check `is_collected` flag is set correctly. Rate = collected / approved.

**Q: Budget calculations wrong**
A: Verify budget_committed values in approval_requests. Total = sum of all approved option budgets.
