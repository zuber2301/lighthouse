# Phase 1 File Structure Reference

## New Files Created

```
/root/uniplane-repos/lighthouse/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   └── events.py (NEW)
│   │   │       - Event model (event metadata, budget tracking)
│   │   │       - EventOption model (tracks/inventory with stock limits)
│   │   │       - EventRegistration model (user registration ledger)
│   │   │       - EventType enum (ANNUAL_DAY, GIFTING)
│   │   │       - RegistrationStatus enum (PENDING, APPROVED, REJECTED, CANCELLED)
│   │   │
│   │   ├── schemas/
│   │   │   └── events.py (NEW)
│   │   │       - EventCreate, EventUpdate, EventOut
│   │   │       - EventOptionCreate, EventOptionOut
│   │   │       - EventRegistrationCreate, EventRegistrationUpdate, EventRegistrationOut
│   │   │       - BudgetVarianceResponse
│   │   │       - EventOptionVariance
│   │   │       - ConflictDetectionResult
│   │   │
│   │   ├── api/
│   │   │   └── events.py (NEW)
│   │   │       - 13 API endpoints for CRUD, registration, analytics
│   │   │       - Event management: POST, GET, PUT, DELETE
│   │   │       - Event options: POST, GET
│   │   │       - Registrations: POST, GET, PUT
│   │   │       - Analytics: GET /budget-variance, POST /check-conflicts
│   │   │
│   │   ├── services/
│   │   │   └── event_service.py (NEW)
│   │   │       - EventService class with business logic
│   │   │       - calculate_budget_variance()
│   │   │       - detect_conflicts() with 4-tier validation
│   │   │       - update_budget_committed()
│   │   │       - update_option_committed_count()
│   │   │       - Helper methods for slot and inventory checks
│   │   │
│   │   ├── models/__init__.py (MODIFIED)
│   │   │       + Import Event, EventOption, EventRegistration
│   │   │       + Import EventType, RegistrationStatus
│   │   │
│   │   └── main.py (MODIFIED)
│   │       + Import events module
│   │       + Register events router
│   │
│   ├── migrations/
│   │   └── versions/
│   │       └── 0015_add_event_management.py (NEW)
│   │           - Create events table
│   │           - Create event_options table
│   │           - Create event_registrations table
│   │           - Create event_type and registration_status enums
│   │           - Add appropriate indices
│   │           - Downgrade logic
│   │
│   └── [other existing files]
│
└── [documentation]
    ├── EVENT_BUDGET_IMPLEMENTATION.md (NEW)
    │   - 400+ lines of comprehensive implementation documentation
    │   - Database schema details
    │   - All API endpoints with examples
    │   - Service layer explanation
    │   - Data flow scenarios
    │   - Integration points
    │
    ├── EVENT_BUDGET_TESTING.md (NEW)
    │   - Quick start guide
    │   - cURL examples for all endpoints
    │   - Expected responses
    │   - Test scenarios
    │   - Database debugging queries
    │   - Common issues and solutions
    │
    ├── PHASE1_SUMMARY.md (NEW)
    │   - High-level overview
    │   - Features checklist
    │   - Design decisions
    │   - Code quality notes
    │   - Performance considerations
    │   - Next steps
    │
    └── PHASE1_CHECKLIST.md (NEW)
        - Completion checklist
        - All components verified
        - Files summary
        - Ready for production checklist
```

## File Dependencies & Relationships

```
┌─────────────────────────────────────────────────────────┐
│                     main.py                             │
│  (FastAPI application - registers routes)              │
└──────────────────────┬──────────────────────────────────┘
                       │ include_router(events.router)
                       │
         ┌─────────────v─────────────┐
         │    api/events.py           │
         │  (FastAPI router with      │
         │   13 endpoints)            │
         └──────────────┬─────────────┘
                        │
        ┌───────────────v────────────────┐
        │  services/event_service.py      │
        │ (Business logic for budget      │
        │  variance & conflict detection) │
        └───────────────┬────────────────┘
                        │
       ┌────────────────v──────────────────┐
       │ models/events.py                   │
       │ (SQLAlchemy ORM models)            │
       │ - Event                            │
       │ - EventOption                      │
       │ - EventRegistration                │
       └────────────────┬──────────────────┘
                        │
       ┌────────────────v──────────────────┐
       │ schemas/events.py                  │
       │ (Pydantic validation models)       │
       │ - EventCreate, EventOut            │
       │ - EventOptionCreate, Out           │
       │ - EventRegistrationCreate, Out     │
       │ - BudgetVarianceResponse           │
       │ - ConflictDetectionResult          │
       └────────────────┬──────────────────┘
                        │
       ┌────────────────v──────────────────┐
       │ migrations/0015_*.py               │
       │ (Alembic migration file)           │
       │ Creates: events, event_options,    │
       │          event_registrations tables│
       └────────────────────────────────────┘
```

## Database Schema Relationships

```
┌──────────────────────────────────────────────────────────┐
│                     users (existing)                      │
│         id | email | full_name | tenant_id | ...        │
└──────────────────────────────────────────────────────────┘
     ▲         ▲                                  ▲
     │         │                                  │
     │         │ created_by                       │ tenant_id
     │         │                                  │
     │         │ ┌────────────────────────────────┼─────────┐
     │         │ │                                │         │
     │         │ │  ┌────────────────────────────┘         │
     │         │ │  │                                      │
┌────┴─────────┴─┼──▼──────────────────────────────────────▼──┐
│           events                                              │
│ id | tenant_id | name | event_type | event_budget_amount |  │
│ budget_committed | event_date | registration_start_date  │  │
│ registration_end_date | is_active | created_at | created_by │
└────────────────┬───────────────────────────────────────────┘
                 │ 1:N relationship
                 │
                 ▼
     ┌────────────────────────────────────┐
     │      event_options                 │
     │ id | tenant_id | event_id |        │
     │ option_name | option_type |        │
     │ total_available | committed_count  │
     │ cost_per_unit | is_active |        │
     │ created_at                         │
     └────────────────┬────────────────────┘
                      │
                      │ 1:N relationship
                      │
                      ▼
     ┌──────────────────────────────────────┐
     │      event_registrations             │
     │ id | tenant_id | event_id | user_id │
     │ event_option_id | status |           │
     │ qr_token | preferred_pickup_slot |   │
     │ assigned_pickup_slot |               │
     │ amount_committed | notes |           │
     │ created_at | approved_at |           │
     │ approved_by                          │
     └──────────────────────────────────────┘
```

## Import Chain

```
main.py
  ├─> from app.api import events
  │   └─> from app.api.events import router
  │       ├─> from app.models.events import Event, EventOption, EventRegistration
  │       ├─> from app.schemas.events import EventCreate, EventOut, ...
  │       └─> from app.services.event_service import EventService
  │           └─> from app.models.events import Event, EventOption, EventRegistration
  │
  ├─> from app.db.base import Base
  │   ├─> app/models/__init__.py
  │   │   └─> from .events import Event, EventOption, EventRegistration
  │   │
  │   └─> migrations/env.py
  │       ├─> import app.models
  │       │   └─> triggers all model imports including events.py
  │       └─> from app.db.base import Base
  │           └─> Base.metadata contains all models
  │
  └─> [other routers and dependencies]
```

## Database Schema Query Plan

```
When application starts:
  1. main.py creates FastAPI app
  2. startup event: create_tables() runs
     - Imports all models via: import app.models
     - Alembic discovers models from Base.metadata
     - Executes pending migrations (e.g., 0015_add_event_management.py)
  3. events router becomes available at /events

Migration execution:
  alembic upgrade head
  -> Finds 0015_add_event_management.py
  -> Creates events table
  -> Creates event_options table  
  -> Creates event_registrations table
  -> Creates event_type enum
  -> Creates registration_status enum
  -> Adds indices on tenant_id, event_id, user_id, qr_token
```

## Testing File Locations

```
For manual testing:
  - Use examples in: EVENT_BUDGET_TESTING.md
  - Run curl commands from: Anywhere with network access to backend
  - Debug queries in: PostgreSQL or pgAdmin using examples in EVENT_BUDGET_TESTING.md

For unit tests (to be created in Phase 2):
  - backend/tests/test_event_service.py
  - backend/tests/test_events_api.py

For integration tests (to be created in Phase 2):
  - backend/tests/test_event_workflow.py
```

## Configuration & Environment

```
No new environment variables required.
Uses existing:
  - DATABASE_URL: PostgreSQL connection
  - CURRENT_TENANT: Tenancy context from middleware
  - Authentication token from get_current_user()

Migration assumes:
  - Alembic is configured (alembic.ini exists)
  - SQLAlchemy models are in app/models/
  - Database has necessary permissions
```

## Deployment Checklist

```
Before deployment:
  ☐ Run migration: alembic upgrade head
  ☐ Test all 13 endpoints with provided examples
  ☐ Verify tenant isolation works
  ☐ Check conflict detection in various scenarios
  ☐ Validate budget variance calculations
  ☐ Review database indices performance

Docker deployment:
  ☐ Build new image with updated code
  ☐ Update docker-compose.yml if needed
  ☐ Run migrations in container
  ☐ Verify health checks pass

Post-deployment:
  ☐ Monitor /events endpoints
  ☐ Check database query performance
  ☐ Verify event creation and registration flows
  ☐ Monitor budget tracking accuracy
```

---

**Created**: January 27, 2026
**Ready**: ✅ All files created and integrated
**Next**: Run `alembic upgrade head` and test endpoints
