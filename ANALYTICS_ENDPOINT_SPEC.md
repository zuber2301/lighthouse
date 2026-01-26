# Tenant Insights Analytics Endpoint

## Endpoint
```
GET /platform/tenant-insights/{tenant_id}
```

**Authentication**: Requires `PLATFORM_OWNER` or `SUPER_ADMIN` role

---

## Response Structure

### Example JSON Response

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

---

## Field Definitions

### `recognition_velocity`
**Purpose**: Measures if company culture is accelerating or declining

| Field | Type | Description |
|-------|------|-------------|
| `current_week` | int | Awards sent in last 7 days |
| `previous_week` | int | Awards sent in the 7 days before that |
| `growth_percentage` | float | Percentage change; 100 if previous was 0 |
| `trend` | enum | `UP`, `DOWN`, or `FLAT` |
| `interpretation` | string | Human-readable culture trend |

**Interpretation Logic**:
- `> 20%`: Culture is accelerating
- `-20% to 20%`: Culture is stable
- `< -20%`: Culture is declining

---

### `participation_rate`
**Purpose**: What % of active users actually use the platform

**Calculation**: (Users who sent OR received ≥1 recognition / Total active CORPORATE_USERS) × 100

**Benchmark**:
- `> 80%`: Exceptional adoption
- `60-80%`: Healthy engagement
- `40-60%`: Room for improvement
- `< 40%`: Urgent outreach needed

---

### `dark_zone`
**Purpose**: Identifies users at risk of attrition

**Selection Criteria**: CORPORATE_USERS who haven't received recognition in 30+ days

| Field | Type | Description |
|-------|------|-------------|
| `count` | int | Total at-risk users |
| `severity` | enum | `CRITICAL` (>10), `HIGH` (5-10), `NORMAL` (<5) |
| `users[].days_since_recognition` | int | 999 if never recognized |

**Action Items**:
- **CRITICAL**: Tenant Lead should conduct engagement initiative
- **HIGH**: Monitor closely; reach out to these users
- **NORMAL**: Standard follow-up cadence

---

### `budget_metrics`
**Purpose**: Tracks financial sustainability of recognition program

| Field | Type | Description |
|-------|------|-------------|
| `current_balance_paise` | int | Points remaining in master budget |
| `total_distributed_paise` | int | Total points ever issued |
| `burn_rate_percentage` | float | (distributed / capacity) × 100 |
| `capacity` | int | balance + distributed |
| `monthly_run_rate` | int | Average monthly spend (distributed / 30) |
| `health` | enum | `SUSTAINABLE` (<70%), `WARNING` (70-90%), `CRITICAL` (>90%) |

**Use Cases**:
- Tenant Admin monitors burn rate to avoid budget surprises
- Helps predict when new budget load is needed
- Identifies if leads are under-utilizing their allocations

---

### `cross_dept_collaboration`
**Purpose**: Measures if recognition breaks down organizational silos

| Field | Type | Description |
|-------|------|-------------|
| `percentage` | float | % of awards sent across departments |
| `total_cross_dept_awards` | int | Count of cross-dept recognitions |
| `interpretation` | string | Narrative explanation |

**Thresholds**:
- `> 50%`: Silos being broken down ✓
- `25-50%`: Silos present (opportunity)
- `< 25%`: Heavy silos detected (risk)

---

### `top_champions`
**Purpose**: Celebrates and identifies culture drivers

**Selection**: Users who sent the most awards in last 30 days (top 5)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | User ID |
| `full_name` | string | User's full name |
| `job_title` | string | Job title/role |
| `awards_sent` | int | Number of recognitions sent |

**Use Cases**:
- Recognize culture champions publicly
- Identify peer leaders for mentoring programs
- Understand who drives engagement

---

### `metrics_summary`
**Purpose**: Provides data scope context

| Field | Type | Description |
|-------|------|-------------|
| `total_recognitions_tracked` | int | Total awards in analysis period |
| `active_user_count` | int | Active CORPORATE_USERS in tenant |
| `period` | string | Always "Last 30 days" |

---

## Implementation Details

### SQL Queries Executed

#### 1. Recognition Velocity
```sql
-- Current week (last 7 days)
SELECT COUNT(*) FROM recognitions 
WHERE tenant_id = ? AND created_at >= CURRENT_DATE - INTERVAL '7 days'

-- Previous week
SELECT COUNT(*) FROM recognitions 
WHERE tenant_id = ? 
  AND created_at >= CURRENT_DATE - INTERVAL '14 days'
  AND created_at < CURRENT_DATE - INTERVAL '7 days'
```

#### 2. Dark Zone (Recognition Gap)
```sql
SELECT DISTINCT u.id, u.full_name, u.job_title, u.department,
  MAX(r.created_at) as last_recognition_date
FROM users u
LEFT JOIN recognitions r ON u.id = r.nominee_id 
  AND r.tenant_id = ?
WHERE u.tenant_id = ? 
  AND u.role = 'CORPORATE_USER'
  AND (r.id IS NULL OR r.created_at < CURRENT_DATE - INTERVAL '30 days')
GROUP BY u.id
ORDER BY MAX(r.created_at) ASC
```

#### 3. Budget Burn Rate
```sql
SELECT 
  t.master_budget_balance as current_balance,
  SUM(r.points) as total_distributed
FROM tenants t
LEFT JOIN recognitions r ON t.id = r.tenant_id
WHERE t.id = ?
GROUP BY t.id
```

#### 4. Cross-Department Collaboration
```sql
SELECT COUNT(*) as cross_dept_count
FROM recognitions r
JOIN users sender ON r.nominator_id = sender.id
JOIN users receiver ON r.nominee_id = receiver.id
WHERE r.tenant_id = ?
  AND sender.department != receiver.department
  AND sender.department IS NOT NULL
  AND receiver.department IS NOT NULL
```

#### 5. Top Recognition Champions
```sql
SELECT u.id, u.full_name, u.job_title, COUNT(r.id) as awards_sent
FROM users u
JOIN recognitions r ON u.id = r.nominator_id
WHERE r.tenant_id = ?
  AND r.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id
ORDER BY awards_sent DESC
LIMIT 5
```

#### 6. Participation Rate
```sql
SELECT 
  COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN u.id END) as engaged_users,
  COUNT(DISTINCT u.id) as total_users
FROM users u
LEFT JOIN recognitions r ON (u.id = r.nominator_id OR u.id = r.nominee_id)
WHERE u.tenant_id = ?
  AND u.role = 'CORPORATE_USER'
  AND u.is_active = true
```

---

## Performance Optimization

- **Execution Model**: Async/Parallel where possible
- **Indexes Required**:
  - `recognitions(tenant_id, created_at)`
  - `recognitions(nominee_id, created_at)`
  - `recognitions(nominator_id, created_at)`
  - `users(tenant_id, role, is_active)`

- **Caching**: Results can be cached for 1 hour per tenant
- **Latency**: ~100-500ms for typical tenant (100-1000 users)

---

## Error Handling

### 400 Bad Request
- Tenant ID format invalid
- Tenant not found
- User lacks authorization

### 500 Internal Server Error
- Database connection failure
- Unexpected null value in calculations
- Query execution timeout

### Graceful Fallbacks
Frontend implements mock data fallback if API is unavailable.

---

## Frontend Integration

### Usage in React
```javascript
const response = await api.get(`/platform/tenant-insights/${tenantId}`)
const insights = response.data

// Recognition Velocity
console.log(insights.recognition_velocity.growth_percentage) // 16.67
console.log(insights.recognition_velocity.trend) // "UP"

// Dark Zone Alert
if (insights.dark_zone.severity === 'CRITICAL') {
  // Show red alert banner
}

// Culture Score Calculation
const cultureScore = 
  (insights.participation_rate * 0.4) +
  ((100 - insights.budget_metrics.burn_rate_percentage) * 0.3) +
  (insights.cross_dept_collaboration.percentage * 0.3)
```

---

## Deployment Checklist

- [ ] Add route to FastAPI router in `app/main.py`
- [ ] Test with sample tenant data
- [ ] Verify async/await behavior
- [ ] Monitor query performance
- [ ] Set up alerts for high dark_zone.severity
- [ ] Document in API spec/Swagger
- [ ] Add request/response logging
