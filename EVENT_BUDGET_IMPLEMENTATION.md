# Phase 1: Event Budget Management System - Implementation Guide

## Overview

This document describes the Phase 1 implementation of the Event Budget Management System, which expands the Lighthouse backend to handle "Event-specific" budgets and registration lifecycle management.

## Architecture

### 1. Database Layer

Three new tables have been added to the PostgreSQL schema:

#### `events` Table
Stores event metadata and budget information.

**Columns:**
- `id` (UUID): Primary key
- `tenant_id` (String): Tenant isolation
- `name` (String): Event name
- `description` (Text): Event description
- `event_type` (Enum): ANNUAL_DAY or GIFTING
- `event_budget_amount` (Decimal): Total budget allocated to the event
- `budget_committed` (Decimal): Running total of committed budget (updated as registrations are approved)
- `event_date` (DateTime): When the event occurs
- `registration_start_date` (DateTime): Registration window opens
- `registration_end_date` (DateTime): Registration window closes
- `is_active` (Integer): Soft delete flag
- `created_at`, `created_by`: Audit trail

**Key Features:**
- Isolated event budget separate from department/pool budgets
- Automatic tracking of budget commitment via `budget_committed`
- Time-windowed registration to control when users can register

#### `event_options` Table
Stores individual tracks (Singing/Dancing) or inventory items (Backpacks/Jackets) with stock limits.

**Columns:**
- `id` (UUID): Primary key
- `tenant_id` (String): Tenant isolation
- `event_id` (UUID): Foreign key to events
- `option_name` (String): Human-readable name (e.g., "Singing Track", "Medium Backpack")
- `option_type` (String): TRACK or INVENTORY classification
- `description` (Text): Additional details
- `total_available` (Integer): Total slots/inventory count
- `committed_count` (Integer): Count of approved registrations
- `cost_per_unit` (Decimal): Optional pricing for gifting items
- `is_active` (Integer): Soft delete flag
- `created_at`: Timestamp

**Key Features:**
- Stock/capacity management with `total_available` and `committed_count`
- Computed property `available_slots = total_available - committed_count`
- Support for both time-bound tracks and physical inventory items

#### `event_registrations` Table
The "ledger" linking users to event choices with full lifecycle tracking.

**Columns:**
- `id` (UUID): Primary key
- `tenant_id` (String): Tenant isolation
- `event_id` (UUID): Foreign key to events
- `user_id` (UUID): Foreign key to users
- `event_option_id` (UUID): Foreign key to selected option (nullable)
- `status` (Enum): PENDING → APPROVED → REJECTED/CANCELLED
- `qr_token` (String): Unique token for verification/pickup
- `preferred_pickup_slot` (String): User's preferred time slot
- `assigned_pickup_slot` (String): Organizer's assigned slot
- `amount_committed` (Decimal): Budget amount reserved for this registration
- `notes` (Text): Approval notes or comments
- `created_at`, `approved_at`, `approved_by`: Audit trail

**Key Features:**
- Complete registration lifecycle tracking
- QR token generation for contact-less verification
- Pickup slot scheduling with flexible assignment
- Budget and inventory commitment tracking

---

## API Layer

### Base Path: `/events`

All endpoints are tenant-scoped and require authentication.

### Event Management Endpoints

#### `POST /events` - Create Event
**Request:**
```json
{
  "name": "Tech Day 2024",
  "description": "Annual tech celebration",
  "event_type": "ANNUAL_DAY",
  "event_budget_amount": 50000.00,
  "event_date": "2024-06-15T10:00:00Z",
  "registration_start_date": "2024-06-01T00:00:00Z",
  "registration_end_date": "2024-06-14T23:59:59Z",
  "options": [
    {
      "option_name": "Singing Track",
      "option_type": "TRACK",
      "description": "Participate in the singing competition",
      "total_available": 30,
      "cost_per_unit": 500.00
    },
    {
      "option_name": "Medium Backpack",
      "option_type": "INVENTORY",
      "description": "Limited edition event backpack",
      "total_available": 100,
      "cost_per_unit": 1500.00
    }
  ]
}
```

**Response:** 201 Created with full event details

#### `GET /events` - List Events
Query Parameters:
- `skip`: Number of results to skip (default: 0)
- `limit`: Max results (default: 10, max: 100)
- `is_active`: Filter by active status (1 or 0)

**Response:** Array of EventOut objects

#### `GET /events/{event_id}` - Get Event Details
**Response:** Full EventOut object with all options

#### `PUT /events/{event_id}` - Update Event
Can update most fields except budget_committed (managed automatically).

#### `DELETE /events/{event_id}` - Soft Delete Event
Sets `is_active = 0` to retain historical data.

### Event Option Endpoints

#### `POST /events/{event_id}/options` - Add Option to Event
Create a new track or inventory option after event creation.

#### `GET /events/{event_id}/options` - List Options
Returns all active options for an event.

### Event Registration Endpoints

#### `POST /events/{event_id}/register` - Register User for Event
**Request:**
```json
{
  "event_id": "event-uuid",
  "event_option_id": "option-uuid",
  "preferred_pickup_slot": "2024-06-15 10:00-11:00",
  "notes": "Prefer morning slot"
}
```

**Features:**
- Automatic conflict detection before registration
- Generates unique QR token
- Creates PENDING registration (approval needed by organizer)

**Response:** 201 Created or 409 Conflict with details

#### `GET /events/{event_id}/registrations` - List Registrations
Query Parameters:
- `status_filter`: Filter by PENDING, APPROVED, REJECTED, or CANCELLED
- `skip`, `limit`: Pagination

#### `GET /events/{event_id}/registrations/{registration_id}` - Get Registration Details
Returns full registration with user and option info.

#### `PUT /events/{event_id}/registrations/{registration_id}` - Update Registration Status
**Request:**
```json
{
  "status": "APPROVED",
  "assigned_pickup_slot": "2024-06-15 10:00-11:00",
  "notes": "Approved - morning shift assigned"
}
```

**Automatic Actions:**
- **PENDING → APPROVED:** Commits budget amount and inventory count
- **APPROVED → REJECTED/CANCELLED:** Rolls back budget and inventory

### Analytics Endpoints

#### `GET /events/{event_id}/budget-variance` - Budget Variance Report
Returns detailed budget analysis:

**Response:**
```json
{
  "event_id": "event-uuid",
  "event_name": "Tech Day 2024",
  "total_budget": 50000.00,
  "budget_committed": 25000.00,
  "budget_available": 25000.00,
  "utilization_percentage": 50.0,
  "registered_users_count": 150,
  "approved_registrations_count": 75,
  "pending_registrations_count": 75,
  "option_variance": [
    {
      "option_id": "opt-uuid",
      "option_name": "Singing Track",
      "total_available": 30,
      "committed_count": 20,
      "available_slots": 10,
      "utilization_percentage": 66.67
    }
  ]
}
```

**Metrics Provided:**
- Budget allocation vs commitment ratio
- Utilization percentage by budget and by option
- Registration status breakdown
- Per-option inventory metrics

#### `POST /events/{event_id}/check-conflicts` - Pre-flight Conflict Detection
Allows frontend to check for conflicts before user submits registration.

**Request:**
```json
{
  "event_option_id": "opt-uuid",
  "preferred_pickup_slot": "2024-06-15 10:00-11:00"
}
```

**Response (No Conflict):**
```json
{
  "has_conflict": false
}
```

**Response (With Conflict):**
```json
{
  "has_conflict": true,
  "conflict_type": "INVENTORY_EXHAUSTED",
  "conflict_message": "No inventory available for Medium Backpack",
  "available_alternatives": [
    "Large Backpack (50 slots)",
    "Small Backpack (25 slots)"
  ]
}
```

---

## Service Layer

### EventService

Located in `app/services/event_service.py`, provides business logic for:

#### `calculate_budget_variance()`
Computes budget metrics:
- Allocated vs committed budget
- Utilization percentage (committed / allocated * 100)
- Per-option utilization metrics
- Registration counts by status

#### `detect_conflicts()`
Comprehensive conflict detection with 4 checks:

1. **Registration Window Check**
   - Validates event registration is currently open
   - Returns `REGISTRATION_CLOSED` conflict if outside window

2. **Budget Exhaustion Check**
   - Ensures event budget_available > 0
   - Returns `BUDGET_EXHAUSTED` conflict if budget fully committed

3. **Inventory Availability Check**
   - For selected option, ensures available_slots > 0
   - Returns `INVENTORY_EXHAUSTED` conflict with available alternatives
   - Identifies other options of same type with available inventory

4. **Time Slot Overbooking Check**
   - Limits max 10 approved registrations per pickup slot
   - Returns `SLOT_CONFLICT` conflict with available alternative slots
   - Generates available slots for remaining capacity

#### `update_budget_committed()`
Increments event budget_committed when registration is approved.

#### `update_option_committed_count()`
Increments option inventory when registration is approved.

---

## Data Flow Examples

### Scenario 1: User Registration Flow

```
User registers → detect_conflicts() → 
  ✓ Window open?
  ✓ Budget available?
  ✓ Inventory available?
  ✓ Slot not overbooked?
  → Create registration (PENDING status)
  → Emit QR token
  → Return 201 with registration details
```

### Scenario 2: Organizer Approval Flow

```
Organizer approves registration → 
  Update status to APPROVED →
  Increment event.budget_committed by amount_committed →
  Increment option.committed_count by 1 →
  Set approved_at timestamp
  Set approved_by user_id →
  Return updated registration
```

### Scenario 3: Budget Variance Check

```
GET /events/{id}/budget-variance →
  Sum all approved registration amounts → budget_committed
  Calculate: budget_available = budget_amount - budget_committed
  Calculate: utilization = (budget_committed / budget_amount) * 100
  For each option:
    utilization = (committed_count / total_available) * 100
  Return comprehensive report
```

---

## Database Migration

Migration file: `migrations/versions/0015_add_event_management.py`

**To apply migration:**
```bash
cd backend
alembic upgrade head
```

**Tables created:**
- `events` (with index on tenant_id)
- `event_options` (with indices on tenant_id, event_id)
- `event_registrations` (with indices on tenant_id, event_id, user_id, qr_token)

**ENUMs created:**
- `event_type`: ANNUAL_DAY, GIFTING
- `registration_status`: PENDING, APPROVED, REJECTED, CANCELLED

---

## Integration Points

### 1. Tenant Context
- All endpoints use `tenancy.CURRENT_TENANT.get()` for multi-tenancy
- Events are isolated per tenant
- Cross-tenant access is prevented

### 2. Authentication
- All endpoints require `get_current_user()` dependency
- current_user.id tracked in created_by, approved_by fields

### 3. FastAPI Main App
- Events router registered in `app/main.py`
- Mounted at `/events` prefix
- Follows tenancy middleware pattern

### 4. Model Registration
- Event models imported in `app/models/__init__.py`
- Alembic automatically discovers models from Base.metadata

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- **201 Created**: Successful resource creation
- **204 No Content**: Successful deletion
- **400 Bad Request**: Invalid input (validation error)
- **403 Forbidden**: Tenant context missing
- **404 Not Found**: Resource not found
- **409 Conflict**: Registration conflict with details

Conflict responses include structured data:
```json
{
  "conflict_type": "INVENTORY_EXHAUSTED",
  "message": "Detailed explanation",
  "alternatives": ["Option A", "Option B"]
}
```

---

## Future Enhancements

### Phase 2 Possibilities:
1. **Waitlist Management**: Queue registrations when capacity exhausted
2. **Payment Integration**: Track if registration requires payment
3. **Notification System**: Notify users on approval/rejection
4. **Analytics Dashboard**: Visualize budget and registration metrics
5. **Batch Operations**: Approve/reject multiple registrations at once
6. **Seat Assignment**: Assign specific seats/rows for events
7. **Team Registrations**: Allow group registrations as teams
8. **Cancellation Policies**: Handle cancellation deadlines and refunds

---

## Testing Recommendations

### Unit Tests
- Conflict detection logic
- Budget variance calculations
- Option availability checks
- Status transition validation

### Integration Tests
- Event creation with options
- Registration approval workflow
- Budget tracking accuracy
- Inventory decrement logic
- Conflict detection with real data

### API Tests
- CRUD operations for all endpoints
- Pagination and filtering
- Error responses and validation
- Tenant isolation
- Concurrent registration handling

---

## Configuration & Limits

**Current Defaults** (adjustable in code):
- Max registrations per pickup slot: 10
- Pickup slot format: "HH:00-HH:59" (1-hour intervals)
- Pickup window: 8 AM to 6 PM (10 hours)

These can be made configurable via environment variables in Phase 2.
