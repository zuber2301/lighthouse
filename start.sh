#!/bin/bash

# Start both backend and frontend servers

echo "Starting Lighthouse servers..."

# Start backend in background
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 18000 --reload &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Servers started. Press Ctrl+C to stop."

# Wait for interrupt
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait