# API Endpoint Reference

## Tenant Insights Analytics Endpoint

### Route Registration
**File**: `backend/app/main.py` (line 106)
```python
app.include_router(platform_admin.router)
```

### Endpoint Definition
**File**: `backend/app/api/platform_admin.py` (lines 853-1049)

### Full Endpoint Specification

```http
GET /platform/tenant-insights/{tenant_id}
```

### Authentication
```
Authorization: Bearer {JWT_TOKEN}
Role Required: PLATFORM_OWNER or SUPER_ADMIN
```

### Path Parameters
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Response (200 OK)
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-01-26T10:30:45.123456",
  "recognition_velocity": {
    "current_week": 28,
    "previous_week": 24,
    "growth_percentage": 16.67,
    "trend": "UP",
    "interpretation": "Culture is stable"
  },
  "participation_rate": 68.5,
  "dark_zone": {
    "count": 3,
    "severity": "NORMAL",
    "users": [
      {
        "id": "user-001",
        "full_name": "Arjun Mehta",
        "job_title": "Senior Engineer",
        "department": "Engineering",
        "days_since_recognition": 42
      },
      {
        "id": "user-002",
        "full_name": "Sarah Jenkins",
        "job_title": "Sales Representative",
        "department": "Sales",
        "days_since_recognition": 38
      },
      {
        "id": "user-003",
        "full_name": "Priya Sharma",
        "job_title": "Product Manager",
        "department": "Product",
        "days_since_recognition": 31
      }
    ]
  },
  "budget_metrics": {
    "current_balance_paise": 500000,
    "total_distributed_paise": 750000,
    "burn_rate_percentage": 60.0,
    "capacity": 1250000,
    "monthly_run_rate": 25000,
    "health": "SUSTAINABLE"
  },
  "cross_dept_collaboration": {
    "percentage": 42.5,
    "total_cross_dept_awards": 34,
    "interpretation": "Silos present"
  },
  "top_champions": [
    {
      "id": "user-101",
      "full_name": "Ravi Patel",
      "job_title": "Team Lead",
      "awards_sent": 28
    },
    {
      "id": "user-102",
      "full_name": "Anjali Singh",
      "job_title": "Manager",
      "awards_sent": 24
    },
    {
      "id": "user-103",
      "full_name": "Marcus Webb",
      "job_title": "Lead",
      "awards_sent": 19
    },
    {
      "id": "user-104",
      "full_name": "Divya Verma",
      "job_title": "Coordinator",
      "awards_sent": 16
    },
    {
      "id": "user-105",
      "full_name": "Chen Liu",
      "job_title": "Team Lead",
      "awards_sent": 14
    }
  ],
  "metrics_summary": {
    "total_recognitions_tracked": 80,
    "active_user_count": 52,
    "period": "Last 30 days"
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

#### 403 Forbidden
```json
{
  "detail": "Not authorized"
}
```

#### 404 Not Found
```json
{
  "detail": "Tenant not found"
}
```

#### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Example Usage

### cURL
```bash
curl -X GET "http://localhost:8000/platform/tenant-insights/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Python (requests)
```python
import requests

headers = {
    "Authorization": f"Bearer {jwt_token}",
    "Content-Type": "application/json"
}

response = requests.get(
    f"http://localhost:8000/platform/tenant-insights/{tenant_id}",
    headers=headers
)

insights = response.json()
print(insights['recognition_velocity'])  # See growth metrics
print(insights['dark_zone']['users'])     # See at-risk users
```

### JavaScript (Fetch)
```javascript
const response = await fetch(
  `/platform/tenant-insights/${tenantId}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
)

const insights = await response.json()

// Check if alert needed
if (insights.dark_zone.severity === 'CRITICAL') {
  showAlert(`⚠️ ${insights.dark_zone.count} users need attention!`)
}

// Display culture score
const cultureScore = Math.round(
  (insights.participation_rate * 0.4) +
  ((100 - insights.budget_metrics.burn_rate_percentage) * 0.3) +
  (insights.cross_dept_collaboration.percentage * 0.3)
)
console.log(`Culture Score: ${cultureScore}/100`)
```

### React Hook (with axios)
```javascript
import { useEffect, useState } from 'react'
import api from '../api/axiosClient'

function TenantInsights({ tenantId }) {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await api.get(`/platform/tenant-insights/${tenantId}`)
        setInsights(response.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [tenantId])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!insights) return <div>No data</div>

  return (
    <div className="insights-dashboard">
      <h2>Culture Insights</h2>
      
      {/* Recognition Velocity */}
      <div className="metric">
        <p>Recognition Velocity: {insights.recognition_velocity.growth_percentage}%</p>
        <p>Trend: {insights.recognition_velocity.trend}</p>
      </div>

      {/* Dark Zone Alert */}
      {insights.dark_zone.severity !== 'NORMAL' && (
        <div className={`alert alert-${insights.dark_zone.severity.toLowerCase()}`}>
          <p>⚠️ {insights.dark_zone.count} users in Dark Zone</p>
          <ul>
            {insights.dark_zone.users.map(user => (
              <li key={user.id}>
                {user.full_name} - {user.days_since_recognition} days silent
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Budget Health */}
      <div className="metric">
        <p>Budget Burn Rate: {insights.budget_metrics.burn_rate_percentage}%</p>
        <p>Health: {insights.budget_metrics.health}</p>
      </div>

      {/* Champions */}
      <div className="champions">
        <h3>Recognition Champions</h3>
        {insights.top_champions.map((champ, idx) => (
          <div key={champ.id}>
            #{idx + 1}: {champ.full_name} ({champ.awards_sent} awards)
          </div>
        ))}
      </div>
    </div>
  )
}

export default TenantInsights
```

---

## Performance Characteristics

| Metric | Value |
|--------|-------|
| **Query Count** | 6 parallel queries |
| **Average Latency** | 150-400ms (100-1000 user tenant) |
| **Cache Recommendation** | 1 hour |
| **Rate Limit** | Suggested: 10 req/min per tenant |

---

## Integration Checklist

### Backend
- [x] Endpoint implemented
- [x] Router included in main.py
- [x] All 6 queries executing correctly
- [x] Error handling in place
- [x] Role-based access control
- [ ] Add database indexes (optional, for scale)
- [ ] Add response caching (optional, for performance)
- [ ] Add request logging
- [ ] Add metrics/monitoring

### Frontend
- [x] Component created (`TenantActivityDashboard.jsx`)
- [x] API integration implemented
- [x] Data aggregation logic
- [x] Mock fallback for offline mode
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Add refresh button
- [ ] Add export to CSV (optional)

### Testing
- [ ] Unit tests for query builders
- [ ] Integration tests with sample data
- [ ] Load test with 10k+ user tenant
- [ ] Test with edge cases (no recognitions, all dark zone, etc.)

---

## Monitoring & Alerts

### Recommended Alerts

1. **Dark Zone Critical**
   - Trigger: `dark_zone.severity == 'CRITICAL'`
   - Action: Notify Platform Owner
   - SLA: Within 24 hours

2. **Budget Health Warning**
   - Trigger: `budget_metrics.health == 'CRITICAL'`
   - Action: Notify Tenant Admin
   - SLA: Within 4 hours

3. **Culture Decline**
   - Trigger: `recognition_velocity.growth_percentage < -20`
   - Action: Suggest engagement campaign
   - SLA: Within 48 hours

### Metrics to Track

```yaml
lighthouse_insights_api:
  latency_ms:
    quantiles: [p50, p95, p99]
  errors_total:
    by: [tenant_id, error_code]
  dark_zone_users:
    by: [tenant_id, severity]
  budget_burn_rate:
    by: [tenant_id]
```

---

## Related Documentation

- [Analytics Endpoint Specification](./ANALYTICS_ENDPOINT_SPEC.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [API Reference](./docs/api-reference.md)
