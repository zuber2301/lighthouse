#!/bin/bash

# Comprehensive Test Suite Runner
# This script runs all tests for the Lighthouse project

set -e

echo "🚀 Starting comprehensive test suite for Lighthouse..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Backend Tests
print_status "Running backend tests..."
cd backend

# Install test dependencies if needed
if [ ! -d "venv" ]; then
    print_warning "Virtual environment not found. Creating one..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

# Run backend tests
print_status "Running integration test (quick) - backend/tests/test_integration_onboard.py..."
if pytest -q tests/test_integration_onboard.py::test_onboard_tenant_end_to_end; then
    print_success "Integration test passed!"
else
    print_error "Integration test failed!"
    exit 1
fi

print_status "Running pytest..."
if pytest --tb=short --cov=app --cov-report=term-missing; then
    print_success "Backend tests passed!"
else
    print_error "Backend tests failed!"
    exit 1
fi

cd ..

# Frontend Tests
print_status "Running frontend tests..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_warning "Node modules not found. Installing dependencies..."
    npm install
fi

# Run frontend tests
print_status "Running Vitest..."
if npm run test:coverage; then
    print_success "Frontend tests passed!"
else
    print_error "Frontend tests failed!"
    exit 1
fi

cd ..

print_success "🎉 All tests completed successfully!"
print_status "Test coverage reports generated:"
print_status "  - Backend: backend/htmlcov/index.html"
print_status "  - Frontend: frontend/coverage/index.html"