#!/bin/bash

# Start both backend and frontend servers

echo "Starting Lighthouse servers..."

# Parse arguments: support --migrate to run DB migrations before starting
MIGRATE=0
MIGRATE_ONLY=0
while [[ $# -gt 0 ]]; do
	case "$1" in
		--migrate)
			MIGRATE=1
			shift
			;;
		--migrate-only)
			MIGRATE_ONLY=1
			shift
			;;
		*)
			shift
			;;
	esac
done

# Find a free TCP port starting from a preferred one
find_free_port() {
	preferred=$1
	port=$preferred
	while ss -ltn "sport = :$port" | grep -q LISTEN; do
		port=$((port+1))
	done
	echo $port
}

# Choose backend and frontend ports (avoid killing existing docker-managed listeners)
PREFERRED_BACKEND_PORT=18000
PREFERRED_FRONTEND_PORT=5173
BACKEND_PORT=$(find_free_port $PREFERRED_BACKEND_PORT)
FRONTEND_PORT=$(find_free_port $PREFERRED_FRONTEND_PORT)

echo "Selected backend port: $BACKEND_PORT"
echo "Selected frontend port: $FRONTEND_PORT"

# Start backend in background on the selected port
cd backend
if [[ "$MIGRATE" -eq 1 ]] || [[ "$MIGRATE_ONLY" -eq 1 ]]; then
	echo "Running migrations (upgrade head)..."
	if ! python3 run_migrations.py upgrade; then
		echo "Migrations failed." >&2
		if [[ "$MIGRATE_ONLY" -eq 1 ]]; then
			echo "Exiting due to --migrate-only." >&2
			exit 1
		else
			echo "Aborting start." >&2
			exit 1
		fi
	fi
	echo "Migrations applied successfully."
	if [[ "$MIGRATE_ONLY" -eq 1 ]]; then
		echo "--migrate-only requested; exiting after migrations."
		exit 0
	fi
fi
python3 -m uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 2

# Start frontend using selected port and point it to the backend URL
cd ../frontend

echo "Starting frontend on port $FRONTEND_PORT, proxying to backend:$BACKEND_PORT (IPv4 only)"
# Use IPv4 loopback to avoid localhost resolving to ::1 and force Vite to bind IPv4
BACKEND_URL="http://127.0.0.1:$BACKEND_PORT" BACKEND_PORT="$BACKEND_PORT" npm run dev -- --port $FRONTEND_PORT --host 0.0.0.0 &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID (port $BACKEND_PORT)"
echo "Frontend PID: $FRONTEND_PID (port $FRONTEND_PORT)"
echo "Servers started. Press Ctrl+C to stop."

# Wait for interrupt
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait