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

## Testing

Run tests with:
```bash
./run-tests.sh
```
