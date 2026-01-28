#!/bin/bash

################################################################################
#                                                                              #
#  LIGHTHOUSE BOOTSTRAP SCRIPT                                                #
#  Complete Environment Setup: Docker • Database • Migrations • Seed Data      #
#                                                                              #
#  Usage: ./bootstrap_lighthouse.sh [OPTIONS]                                 #
#                                                                              #
#  Options:                                                                   #
#    --fresh             Full reset: Remove volumes, rebuild images           #
#    --quick             Quick start: Just start containers (assume ready)   #
#    --seed-only         Only run seed scripts on existing database          #
#    --logs              Show container logs after startup                    #
#    --no-seed           Skip seeding, only migrate                          #
#    --help              Show this help message                              #
#                                                                              #
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

# Options
FRESH_START=0
QUICK_START=0
SEED_ONLY=0
SHOW_LOGS=0
SKIP_SEED=0

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --fresh)
            FRESH_START=1
            shift
            ;;
        --quick)
            QUICK_START=1
            shift
            ;;
        --seed-only)
            SEED_ONLY=1
            shift
            ;;
        --logs)
            SHOW_LOGS=1
            shift
            ;;
        --no-seed)
            SKIP_SEED=1
            shift
            ;;
        --help)
            grep '^#' "$0" | head -20
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Helper functions
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker."
        exit 1
    fi
    print_success "Docker installed"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose."
        exit 1
    fi
    print_success "Docker Compose installed"
    
    # Check docker-compose.yml exists
    if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
        print_error "docker-compose.yml not found at $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    print_success "docker-compose.yml found"
    
    # Check seed scripts exist
    if [[ ! -f "$BACKEND_DIR/seed_data.py" ]]; then
        print_warning "seed_data.py not found - some seed operations may fail"
    fi
}

# Fresh start: Clean up volumes and images
fresh_start() {
    print_step "Performing fresh start (removing volumes and rebuilding)..."
    
    print_step "Stopping all containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --volumes || true
    
    print_step "Removing old images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" rm -f || true
    
    print_success "Fresh start completed"
}

# Start Docker containers
start_containers() {
    print_step "Starting Docker containers..."
    
    if [[ $FRESH_START -eq 1 ]]; then
        print_step "Building images..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    else
        print_step "Building images (using cache where possible)..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" build
    fi
    
    print_step "Starting services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    print_success "Docker containers started"
    
    # Wait for services to be ready
    print_step "Waiting for services to be ready..."
    sleep 5
    
    # Check if containers are running
    POSTGRES_STATUS=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps postgres | grep -c "Up" || echo "0")
    BACKEND_STATUS=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps backend | grep -c "Up" || echo "0")
    REDIS_STATUS=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps redis | grep -c "Up" || echo "0")
    
    if [[ $POSTGRES_STATUS -eq 0 ]]; then
        print_error "PostgreSQL container failed to start"
        exit 1
    fi
    print_success "PostgreSQL is running"
    
    if [[ $REDIS_STATUS -eq 0 ]]; then
        print_error "Redis container failed to start"
        exit 1
    fi
    print_success "Redis is running"
    
    if [[ $BACKEND_STATUS -eq 0 ]]; then
        print_error "Backend container failed to start"
        exit 1
    fi
    print_success "Backend is running"
}

# Run database migrations
run_migrations() {
    print_step "Running database migrations..."
    
    if [[ ! -f "$BACKEND_DIR/run_migrations.py" ]]; then
        print_warning "run_migrations.py not found - skipping migrations"
        return
    fi
    
    cd "$BACKEND_DIR"
    
    # Run migrations in the backend container
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend python run_migrations.py upgrade
    
    if [[ $? -eq 0 ]]; then
        print_success "Database migrations completed"
    else
        print_error "Database migrations failed"
        exit 1
    fi
}

# Seed database with initial data
seed_database() {
    if [[ $SKIP_SEED -eq 1 ]]; then
        print_warning "Skipping seed data (--no-seed flag set)"
        return
    fi
    
    print_step "Seeding database with initial data..."
    
    cd "$BACKEND_DIR"
    
    # Main seed data
    if [[ -f "seed_data.py" ]]; then
        print_step "Running main seed_data.py..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend python seed_data.py
        print_success "Main seed data completed"
    fi
    
    # Seed badges and recognitions
    if [[ -f "seed_badges_recognitions.py" ]]; then
        print_step "Seeding badges and recognitions..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend python seed_badges_recognitions.py
        print_success "Badges and recognitions seeded"
    fi
    
    # Additional seed scripts (optional, may not exist)
    if [[ -f "scripts/seed_personas.py" ]]; then
        print_step "Seeding personas..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend python scripts/seed_personas.py || true
    fi
    
    if [[ -f "scripts/seed_105_accounts.py" ]]; then
        print_step "Seeding 105 test accounts..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend python scripts/seed_105_accounts.py || true
    fi
    
    print_success "Database seeding completed"
}

# Wait for backend to be ready
wait_for_backend() {
    print_step "Waiting for backend API to be ready..."
    
    MAX_ATTEMPTS=30
    ATTEMPT=0
    
    while [[ $ATTEMPT -lt $MAX_ATTEMPTS ]]; do
        if curl -s http://localhost:18000/health &> /dev/null || curl -s http://localhost:18000/docs &> /dev/null; then
            print_success "Backend API is ready"
            return 0
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        echo -n "."
        sleep 2
    done
    
    print_warning "Backend may not be fully ready yet, but continuing..."
    return 0
}

# Show status
show_status() {
    echo ""
    print_step "Environment Status"
    echo ""
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    echo ""
}

# Show connection information
show_connection_info() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              LIGHTHOUSE ENVIRONMENT READY                   ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}🌐 Frontend:${NC}"
    echo "   URL: http://localhost:5173"
    echo ""
    echo -e "${BLUE}⚙️  Backend API:${NC}"
    echo "   URL: http://localhost:18000"
    echo "   Docs: http://localhost:18000/docs"
    echo ""
    echo -e "${BLUE}🐘 PostgreSQL:${NC}"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   User: lighthouse"
    echo "   Password: lighthouse"
    echo "   Database: lighthouse"
    echo ""
    echo -e "${BLUE}🔴 Redis:${NC}"
    echo "   Host: localhost"
    echo "   Port: 6379"
    echo ""
    echo -e "${BLUE}📋 Available Commands:${NC}"
    echo "   View logs:        docker-compose logs -f backend"
    echo "   Stop services:    docker-compose down"
    echo "   Reset database:   docker-compose down -v && ./bootstrap_lighthouse.sh"
    echo ""
}

# Show logs
show_logs() {
    if [[ $SHOW_LOGS -eq 1 ]]; then
        print_step "Showing container logs (Ctrl+C to exit)..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
    fi
}

# Main execution
main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         LIGHTHOUSE ENVIRONMENT BOOTSTRAP                    ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    check_prerequisites
    
    if [[ $SEED_ONLY -eq 1 ]]; then
        print_warning "Seed-only mode: Skipping Docker setup"
        seed_database
    elif [[ $QUICK_START -eq 1 ]]; then
        print_warning "Quick-start mode: Assuming containers already configured"
        start_containers
        wait_for_backend
    else
        # Full bootstrap
        if [[ $FRESH_START -eq 1 ]]; then
            fresh_start
        fi
        
        start_containers
        wait_for_backend
        run_migrations
        seed_database
    fi
    
    show_status
    show_connection_info
    show_logs
    
    print_success "Bootstrap complete! 🚀"
}

# Run main function
main "$@"
