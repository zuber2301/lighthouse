# Lighthouse

A recognition and rewards platform.

## Setup

### Backend

1. Install dependencies:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Set up Google OAuth (see GOOGLE_OAUTH_SETUP.md)

3. Run migrations:
   ```bash
   python3 run_migrations.py
   ```

4. Start the server:
   ```bash
   python3 -m uvicorn app.main:app --host 0.0.0.0 --port 18000 --reload
   ```

### Frontend

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:3004
 
## Development helper: start.sh

Use the provided `start.sh` script to start both backend and frontend during local development. The script will:

- Automatically select free ports for the backend (starting at `18000`) and frontend (starting at `3004`) to avoid conflicts with other services (for example Docker containers).
- Export `BACKEND_URL` for the frontend so Vite's proxy points to the backend started by the script.

Run it from the repository root:

```bash
./start.sh
```

The script will print the selected ports. After it starts, test the services like this (replace ports with the ones printed):

```bash
# backend
curl -i http://localhost:<backend_port>/recognitions

# frontend (proxied)
curl -i http://localhost:<frontend_port>/api/recognitions
```

If you prefer fixed ports, set up your environment so the preferred ports are available or modify `start.sh`.

Automatic migrations
--------------------

`start.sh` can run database migrations before starting the backend. Pass the `--migrate` flag to apply migrations (uses `backend/run_migrations.py upgrade`):

```bash
./start.sh --migrate
```

If migrations fail the script will abort and print the migration error.

IPv4-only note
----------------

The development helper now prefers IPv4 to avoid IPv6 conflict situations. It:

- Uses `127.0.0.1` when setting `BACKEND_URL` so the frontend proxy connects over IPv4.
- Starts Vite with `--host 0.0.0.0` which binds on IPv4.

If you need the system-wide policy changed (for example to disable IPv6 binding globally), do that outside this script — the script itself forces IPv4 usage for the local dev servers.

## API Documentation

For detailed API endpoint documentation, see [ENDPOINTS_LIGHTHOUSE.md](ENDPOINTS_LIGHTHOUSE.md).

### Key Features

**User Search on Award Forms**
- The `/user/search` endpoint automatically filters users by the current tenant
- Supports searching by name or email
- Returns up to 25 results matching the query
- Requires valid JWT authentication
- Tenant context is automatically determined from JWT token

**Recognition & Awards**
- Individual awards with customizable point values
- Group awards for team recognition
- E-card designs with custom messaging
- Support for media attachments

**Rewards & Redemptions**
- Point-based reward redemption system
- Global reward catalog
- Custom tenant rewards configuration
- Redemption history and tracking

**Budget Management**
- Master budget allocation at tenant level
- Department/team lead budget distribution
- Real-time budget tracking and logs
- Budget recalculation and adjustments

**Analytics & Insights**
- Recognition frequency analysis
- Budget utilization metrics
- Redemption velocity tracking
- Tenant-specific analytics
- Platform-wide dashboards

## Testing

Run tests with:
```bash
./run-tests.sh
```

For integration tests:
```bash
./seed_data/run_tests_in_docker.sh
```
