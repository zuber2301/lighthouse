# Phase 5 Integration Guide

## Complete Step-by-Step Implementation

---

## Step 1: Apply Database Migration

### 1.1 Run Migration

```bash
cd backend
python3 -m alembic upgrade 0018_add_collection_tracking
```

### 1.2 Verify Schema

```bash
sqlite3 test.db "SELECT sql FROM sqlite_master WHERE type='table' AND name='approval_requests';" | grep -E 'is_collected|collected_at|collected_by'
```

Expected output:
```
`is_collected` INTEGER NOT NULL DEFAULT 0,
`collected_at` DATETIME,
`collected_by` VARCHAR(36),
```

### 1.3 Verify Indices

```bash
sqlite3 test.db "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE '%collected%';"
```

Expected:
```
idx_approval_requests_is_collected
```

---

## Step 2: Update Backend Files

### 2.1 ApprovalRequest Model ✅ DONE

**File:** `backend/app/models/approvals.py`

Added fields:
```python
is_collected = Column(Integer, nullable=False, default=0)
collected_at = Column(DateTime(timezone=True), nullable=True)
collected_by = Column(String(36), ForeignKey('users.id'), nullable=True)
```

Added relationship:
```python
collected_by_user = relationship("User", foreign_keys=[collected_by])
```

Added property:
```python
@property
def is_scannable(self) -> bool:
    """Check if request can be scanned at event"""
    return self.is_approved and not self.is_collected
```

### 2.2 ScannerService ✅ DONE

**File:** `backend/app/services/scanner_service.py`

Key methods:
- `verify_and_collect_qr()` - Main scanning logic
- `get_event_inventory()` - Real-time stock
- `get_collection_status()` - History

### 2.3 Scanner Schemas ✅ DONE

**File:** `backend/app/schemas/scanner.py`

Classes:
- `QRVerifyRequest` - Request format
- `QRVerifyResponse` - Scan response
- `InventoryResponse` - Stock info
- `InventoryOption` - Per-track details
- `CollectionDetail` - Collection entry
- `CollectionStatusResponse` - History
- `ScannerDashboard` - Combined view

### 2.4 Scanner API Routes ✅ DONE

**File:** `backend/app/api/scanner.py`

Endpoints:
- `POST /scanner/verify` - Verify and collect
- `GET /scanner/event/{event_id}/inventory` - Stock
- `GET /scanner/event/{event_id}/collections` - History
- `GET /scanner/event/{event_id}/dashboard` - Full view
- `WS /scanner/ws/event/{event_id}/live` - Real-time (optional)

### 2.5 Register Router ✅ DONE

**File:** `backend/app/main.py`

Added import:
```python
from app.api import ... scanner
```

Added router:
```python
app.include_router(scanner.router)
```

---

## Step 3: Setup Frontend

### 3.1 Install jsQR

```bash
cd frontend
npm install jsqr
```

### 3.2 Add Scanner Component ✅ DONE

**File:** `frontend/src/components/Scanner.jsx`

Features:
- Camera access request
- Real-time QR scanning
- Status feedback (success/error)
- Inventory display
- Collection history

### 3.3 Add Route (Optional)

**File:** `frontend/src/App.jsx`

Add to your routing:
```jsx
import Scanner from './components/Scanner';

// In your router config:
<Route path="/scanner" element={<Scanner />} />
```

Usage:
```
http://localhost:5173/scanner?eventId=evt-001
```

### 3.4 Add Link to Dashboard

**File:** `frontend/src/components/Dashboard.jsx` or EventAdmin section

Add button to launch scanner:
```jsx
<button
  onClick={() => window.open(`/scanner?eventId=${eventId}`, '_blank')}
  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
>
  📱 Scanner
</button>
```

---

## Step 4: Test Integration

### 4.1 Backend Test

Verify all endpoints working:

```bash
# 1. Get event inventory
curl -H "X-Tenant-ID: tenant-001" \
  http://localhost:8000/scanner/event/evt-001/inventory

# 2. Verify QR
curl -X POST http://localhost:8000/scanner/verify \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-001" \
  -d '{"qr_token": "abc123xyz", "event_id": "evt-001"}'

# 3. Get collections
curl -H "X-Tenant-ID: tenant-001" \
  http://localhost:8000/scanner/event/evt-001/collections

# 4. Get dashboard
curl -H "X-Tenant-ID: tenant-001" \
  http://localhost:8000/scanner/event/evt-001/dashboard
```

### 4.2 Frontend Test

1. **Navigate to scanner:**
   ```
   http://localhost:5173/scanner?eventId=evt-001
   ```

2. **Request camera permission**

3. **Scan test QR code** (from approval email or printed)

4. **Verify response:**
   - Green success message
   - Inventory updates
   - Recent collection listed

5. **Test fraud prevention:**
   - Scan same QR again
   - Should show RED alert
   - "⚠️ ALREADY COLLECTED!"

### 4.3 Integration Test

Full flow:

```bash
# 1. Create approval request (Phase 4)
curl -X POST http://localhost:8000/approvals/create \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-001" \
  -d '{
    "event_id": "evt-001",
    "event_option_id": "opt-001",
    "impact_hours_per_week": 3.5,
    "impact_duration_weeks": 8
  }'

# Copy qr_token from response: "abc123xyz"

# 2. Get approval details to extract token
curl -H "X-Tenant-ID: tenant-001" \
  http://localhost:8000/approvals/pending

# 3. Approve request (Phase 4)
curl -X POST http://localhost:8000/approvals/req-001/approve \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-001" \
  -d '{"notes": "Approved!"}'

# Copy qr_token from response

# 4. Verify/collect (Phase 5)
curl -X POST http://localhost:8000/scanner/verify \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-001" \
  -d '{"qr_token": "abc123xyz", "event_id": "evt-001"}'

# Should return SUCCESS with remaining stock
```

---

## Step 5: Configuration

### 5.1 Environment Variables

Add to `.env` or `backend/.env`:

```bash
# Camera permissions (mobile)
ENABLE_CAMERA_ACCESS=true

# Fraud detection
ENABLE_FRAUD_ALERTS=true
FRAUD_ALERT_SOUND=true

# Collection tracking
TRACK_COLLECTIONS=true
```

### 5.2 Mobile Optimization

For mobile devices, ensure:

1. **HTTPS enabled** (camera requires secure context)
   ```bash
   # Development: use ngrok for HTTPS
   ngrok http 8000
   ngrok http 5173
   ```

2. **Device orientation** (lock to portrait)
   ```jsx
   // In Scanner.jsx
   useEffect(() => {
     if (window.screen.orientation) {
       window.screen.orientation.lock('portrait');
     }
   }, []);
   ```

3. **Full-screen support**
   ```jsx
   const enterFullscreen = () => {
     videoRef.current?.requestFullscreen?.();
   };
   ```

---

## Step 6: Deployment

### 6.1 Development

```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 6.2 Docker

```bash
# Build
docker-compose build

# Run
docker-compose up

# Access
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
# Scanner: http://localhost:3000/scanner?eventId=evt-001
```

### 6.3 Production

1. **Build frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy backend:**
   ```bash
   cd backend
   python -m uvicorn app.main:app \
     --host 0.0.0.0 \
     --port 8000 \
     --workers 4
   ```

3. **Serve frontend:**
   ```bash
   # Using nginx
   server {
     listen 80;
     location / {
       root /app/frontend/dist;
       try_files $uri $uri/ /index.html;
     }
     location /api {
       proxy_pass http://backend:8000;
     }
   }
   ```

---

## Troubleshooting

### Issue: Camera Permission Denied

**Symptoms:** "Camera access denied" error

**Solutions:**
1. Check browser permissions (Settings → Privacy → Camera)
2. Use HTTPS (camera requires secure context)
3. Try different browser (Chrome, Firefox tested)
4. Use ngrok for HTTPS tunnel in dev

### Issue: QR Not Scanning

**Symptoms:** Camera shows but no scan results

**Solutions:**
1. Check lighting (QR needs good contrast)
2. Try different QR code (check `qr_code_url` from approval)
3. Check jsQR library loaded: `console.log(typeof jsQR)`
4. Test with online QR code scanner first
5. Check browser console for errors

### Issue: "NOT_FOUND" Response

**Symptoms:** Scan returns "QR code not found"

**Solutions:**
1. Verify QR token is from correct event
2. Check QR is from approved request (not pending/declined)
3. Verify tenant_id in headers matches
4. Check database has approval_requests table

### Issue: "ALREADY_COLLECTED" Always

**Symptoms:** First scan shows "ALREADY_COLLECTED"

**Solutions:**
1. Check `is_collected` field in database:
   ```bash
   sqlite3 test.db "SELECT id, is_collected, collected_at FROM approval_requests WHERE id='req-001';"
   ```
2. Reset collection status:
   ```bash
   sqlite3 test.db "UPDATE approval_requests SET is_collected=0, collected_at=NULL WHERE id='req-001';"
   ```
3. Use fresh approval request for testing

### Issue: Inventory Not Updating

**Symptoms:** Scan succeeds but inventory doesn't change

**Solutions:**
1. Verify `committed_count` updated in event_options:
   ```bash
   sqlite3 test.db "SELECT id, option_name, committed_count FROM event_options WHERE id='opt-001';"
   ```
2. Refresh page (client cache)
3. Check GET inventory endpoint directly:
   ```bash
   curl http://localhost:8000/scanner/event/evt-001/inventory
   ```

### Issue: Authorization Error (403)

**Symptoms:** "Only admin can collect gifts"

**Solutions:**
1. Check user role:
   ```bash
   curl http://localhost:8000/auth/me | grep role
   ```
2. Login as ADMIN or MANAGER
3. Verify X-Tenant-ID header matches user's tenant

### Issue: CORS Error

**Symptoms:** "Access-Control-Allow-Origin" error in console

**Solutions:**
1. Backend CORS already configured in main.py
2. Verify frontend URL in CORS list
3. Check browser dev tools: Network tab to see headers
4. Restart backend after changes

---

## Monitoring

### Check Collection Status

Real-time overview:

```bash
# Count total collected
curl http://localhost:8000/scanner/event/evt-001/inventory \
  | grep total_collected

# Get all collections with timestamps
curl http://localhost:8000/scanner/event/evt-001/collections

# Spot check
sqlite3 test.db "SELECT COUNT(*) FROM approval_requests WHERE is_collected=1 AND event_id='evt-001';"
```

### Verify Fraud Prevention

Test double-scan:

```bash
# Get a scanned QR token
TOKEN=$(sqlite3 test.db "SELECT qr_token FROM approval_requests WHERE is_collected=1 LIMIT 1;")

# Scan once
curl -X POST http://localhost:8000/scanner/verify \
  -H "Content-Type: application/json" \
  -d "{\"qr_token\": \"$TOKEN\", \"event_id\": \"evt-001\"}"

# Result should be:
# "status": "ALREADY_COLLECTED"
# "message": "⚠️ ALREADY COLLECTED! ..."
```

---

## Performance Tuning

### Database Indices

Already created:
- `idx_approval_requests_is_collected` - Fast collection queries
- `idx_approval_requests_tenant_id` - Tenant filtering
- `idx_approval_requests_status` - Status filtering

### API Optimization

**Inventory endpoint** caches per request:
```python
# Within 1 request, doesn't re-query
inventory = await service.get_event_inventory(...)
```

For real caching, add Redis:
```python
from aioredis import Redis

@router.get("/event/{event_id}/inventory")
async def get_event_inventory(event_id: str, cache: Redis = Depends(get_redis)):
    # Check cache first
    cached = await cache.get(f"inventory:{event_id}")
    if cached:
        return json.loads(cached)
    
    # Compute
    result = await service.get_event_inventory(...)
    
    # Cache for 30 seconds
    await cache.setex(f"inventory:{event_id}", 30, json.dumps(result))
    return result
```

---

## Security Checklist

- [ ] HTTPS enabled (camera requires secure context)
- [ ] X-Tenant-ID header validated on all endpoints
- [ ] Admin/Manager role required for all scanner endpoints
- [ ] QR token is unique per request
- [ ] QR token not exposed in logs
- [ ] `collected_by` captures admin user (audit trail)
- [ ] No hardcoded credentials
- [ ] Database connection uses env variables
- [ ] API rate limiting configured (optional)
- [ ] CORS origins restricted to your domains

---

## Rollback Plan

If something goes wrong:

1. **Database:**
   ```bash
   python3 -m alembic downgrade 0017_add_approvals
   ```

2. **Backend:**
   - Remove scanner import from `app/main.py`
   - Remove scanner router registration
   - Restart backend

3. **Frontend:**
   - Remove Scanner component or route
   - Rebuild: `npm run build`
   - Redeploy

---

## Success Indicators

Phase 5 integration complete when:

✅ Scanner component loads at `/scanner?eventId=evt-001`  
✅ Camera permission prompt appears  
✅ Scanning QR shows green ✅ success  
✅ Scanning same QR shows red ⚠️ ALREADY_COLLECTED  
✅ Inventory numbers update real-time  
✅ `collected_by` shows admin name  
✅ `collected_at` shows timestamp  
✅ All tests pass  
✅ Mobile works with camera  
✅ Zero console errors  

---

## Next Steps

1. **Test with real event** - Run Phase 5 during actual event
2. **Gather feedback** - What works, what doesn't
3. **Phase 6** - Analytics, mobile app, escalations
4. **Phase 7** - Reconciliation, reporting

---

Last Updated: January 27, 2026  
Status: ✅ READY FOR INTEGRATION
