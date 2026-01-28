# Tenant Registry Not Showing Data - Troubleshooting Guide

## Likely Causes

### 1. **Backend API Not Responding**
The `PlatformAdminPage` fetches tenants from `/platform/tenants` endpoint. If the API is down, no data will show.

**Check:**
```bash
# Verify backend is running
docker-compose ps

# Test the endpoint
curl http://localhost:18000/platform/tenants -H "Authorization: Bearer YOUR_TOKEN"

# Check backend logs for errors
docker-compose logs backend | tail -100
```

### 2. **User Authentication/Authorization**
The `/platform/tenants` endpoint requires `SUPER_ADMIN` or `PLATFORM_OWNER` role.

**Check:**
- Are you logged in as a PLATFORM_OWNER user?
- Default test user: `admin@acme.com` / `password` (Tenant Admin - NOT platform owner)
- You need a platform-level user to see tenants

### 3. **Database is Empty**
Bootstrap may not have completed successfully or seed data failed.

**Check:**
```bash
# Count tenants in database
docker-compose exec -T postgres psql -U lighthouse -d lighthouse -c "SELECT COUNT(*) FROM tenants;"

# List all tenants
docker-compose exec -T postgres psql -U lighthouse -d lighthouse -c "SELECT id, name, subdomain FROM tenants;"
```

**Solution if empty:**
```bash
# Re-run bootstrap with seed data
./bootstrap_lighthouse.sh --seed-only

# Or full fresh start
./bootstrap_lighthouse.sh --fresh
```

### 4. **Frontend Not Triggering Fetch**
The `useEffect` hook might not be executing.

**Check:**
- Open browser DevTools (F12)
- Go to Network tab
- Look for `/platform/tenants` request
- Check if it returns data (200 response)
- Check Console tab for errors

### 5. **API Endpoint Issue**
The backend endpoint might be misconfigured.

**Check endpoint implementation:**
```bash
grep -r "platform/tenants" /root/uniplane-repos/lighthouse/backend/app/api/
```

---

## Step-by-Step Diagnostic

### Step 1: Verify Database
```bash
docker-compose exec -T postgres psql -U lighthouse -d lighthouse
SELECT COUNT(*) FROM tenants;
SELECT * FROM tenants LIMIT 5;
```

### Step 2: Verify Backend is Running
```bash
docker-compose ps

# Should show:
# lighthouse-backend-1   UP
# lighthouse-postgres-1  UP
```

### Step 3: Test API Directly
```bash
# Without auth (will likely fail)
curl http://localhost:18000/platform/tenants

# Check what endpoints are available
curl http://localhost:18000/docs
```

### Step 4: Check Frontend Network Requests
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Look for `tenants` request
5. Check:
   - Status code (should be 200)
   - Response data (should have array of tenants)
   - Response headers (check Authorization)

### Step 5: Check Frontend Console Errors
1. Open DevTools Console
2. Look for errors like:
   - `Failed to fetch tenants: ...`
   - `401 Unauthorized`
   - `403 Forbidden`
   - `404 Not Found`

---

## Common Issues & Fixes

### Issue: 401 Unauthorized
**Problem:** Auth token missing or invalid
**Solution:** 
- Log out and log back in
- Check that token is stored in localStorage
- Verify you're logged in as correct user role

### Issue: 403 Forbidden
**Problem:** User doesn't have permission (not PLATFORM_OWNER)
**Solution:**
- You need platform-level access, not just tenant access
- Create a PLATFORM_OWNER user or use the default one

### Issue: 404 Not Found
**Problem:** API endpoint doesn't exist
**Solution:**
- Check backend implementation
- Verify `platform_admin.py` router is registered
- Check FastAPI initialization

### Issue: 500 Internal Server Error
**Problem:** Backend crashed or database error
**Solution:**
- Check backend logs: `docker-compose logs backend`
- Check database connection
- Restart backend: `docker-compose restart backend`

### Issue: No Data but Endpoint Returns 200
**Problem:** Data exists but not showing in table
**Solution:**
- Check browser console for rendering errors
- Check if tenants array is empty `[]`
- Verify TenantManager component receives props correctly
- Check if table has display:none CSS hiding it

---

## Quick Recovery

If stuck, do a complete reset:

```bash
# Stop everything
docker-compose down -v

# Fresh bootstrap with all data
./bootstrap_lighthouse.sh --fresh

# Wait for services to be ready
sleep 30

# Verify data
docker-compose exec -T postgres psql -U lighthouse -d lighthouse -c "SELECT COUNT(*) FROM tenants;"

# Check logs
docker-compose logs backend | tail -50
```

---

## What Should Happen

1. ✅ User logs in with PLATFORM_OWNER role
2. ✅ PlatformAdminPage mounts and calls `fetchTenants()`
3. ✅ Frontend makes GET request to `/platform/tenants`
4. ✅ Backend queries database and returns tenant array
5. ✅ Frontend receives data and updates `tenants` state
6. ✅ TenantManager component renders table with tenant rows
7. ✅ Table headers show: Company, Subdomain, Plan, Users, Allocated, Consumed, Left %, Status, Created, Action

If any step fails, data won't display.

---

## Contact Points to Verify

**Frontend:**
- [PlatformAdminPage.jsx](frontend/src/features/admin/PlatformAdminPage.jsx#L37) - fetchTenants() call
- [TenantManager.jsx](frontend/src/components/TenantManager.jsx#L130) - table rendering

**Backend:**
- [platform_admin.py](backend/app/api/platform_admin.py#L110) - `/platform/tenants` endpoint
- [API initialization](backend/app/main.py) - route registration

**Database:**
- `tenants` table
- `users` table (for authentication)
