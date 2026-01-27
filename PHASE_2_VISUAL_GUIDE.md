# Phase 2: Event Studio - Visual Architecture Guide

## System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                    TENANT ADMIN USER                               │
└────────────────────────────────────────────────────────────────────┘
                             ↓
                   🌐 Browser Interface
                    (EventStudioWizard)
                             ↓
┌────────────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER (React)                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  EventStudioWizard.jsx  ←─────────────────┐                       │
│  (Main Container)       └─ useEventWizardForm Hook                │
│       ├─ Step 1: BudgetStep 💰              (State & Validation)  │
│       ├─ Step 2: BasicInfoStep 📋          (localStorage persist) │
│       ├─ Step 3: OptionsStep 🎭/🎁         (Form management)     │
│       ├─ Step 4: SchedulingStep ⏰          (Error tracking)      │
│       ├─ Step 5: ReviewStep ✓              (Conditional logic)    │
│       │                                                            │
│       └─ Image Upload Handler                                     │
│           └─ eventWizardAPI Service                              │
│               (HTTP API calls, validation, error handling)       │
│                                                                   │
│  localStorage: Auto-save form data across sessions              │
│                                                                   │
└────────────────────────────────────────────────────────────────────┘
                             ↕
                      HTTP REST API
                   (JSON Request/Response)
                             ↕
┌────────────────────────────────────────────────────────────────────┐
│                   BACKEND LAYER (FastAPI)                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  event_studio.py Router (8 Endpoints)                             │
│  ├─ POST /step1/budget             → Validate budget             │
│  ├─ POST /step2/event-info         → Validate event info         │
│  ├─ POST /step3/options/annual-day → Validate tracks/tasks       │
│  ├─ POST /step3/options/gifting    → Validate gifts              │
│  ├─ POST /upload-gift-image        → File upload & store         │
│  ├─ POST /step4/scheduling         → Validate locations/slots    │
│  ├─ POST /submit                   → Create event cascade        │
│  └─ GET /events/{id}/preview       → Retrieve full config        │
│                                                                   │
│  Authentication & Authorization                                  │
│  ├─ JWT Token validation                                         │
│  ├─ Tenant context enforcement                                   │
│  └─ Role-based access (admin-only)                              │
│                                                                   │
│  Validation Layer (Pydantic Schemas)                             │
│  ├─ EventBudgetStep                                             │
│  ├─ EventBasicInfoStep                                          │
│  ├─ AnnualDayOptionsStep                                        │
│  ├─ GiftingOptionsStep                                          │
│  ├─ SchedulingStep                                              │
│  └─ 20+ additional helper schemas                               │
│                                                                   │
│  Business Logic Layer                                            │
│  └─ SchedulingEngine Service                                    │
│      ├─ generate_time_slots()                                   │
│      ├─ create_time_slots_for_location()                        │
│      ├─ get_available_slots()                                   │
│      ├─ register_user_for_slot()                                │
│      ├─ validate_slot_configuration()                           │
│      └─ calculate_slot_statistics()                             │
│                                                                   │
│  File Storage                                                    │
│  └─ /uploads/gifts/{uuid}.{ext}                                │
│                                                                   │
└────────────────────────────────────────────────────────────────────┘
                             ↕
                      SQL Queries
                   (SQLAlchemy ORM)
                             ↕
┌────────────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (PostgreSQL)                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Phase 1 Tables (Existing)                                        │
│  └─ events (extended with relationships)                          │
│  └─ event_options (extended +gift_image_url)                     │
│                                                                   │
│  Phase 2 Tables (New)                                            │
│  ├─ event_pickup_locations                                       │
│  │   ├─ id (PK)                                                  │
│  │   ├─ event_id (FK → events)                                   │
│  │   ├─ tenant_id (FK, indexed)                                  │
│  │   ├─ location_name, location_code, floor_number, building    │
│  │   ├─ capacity                                                 │
│  │   └─ Indices: (tenant_id), (event_id), (location_code)      │
│  │                                                                │
│  └─ event_time_slots                                            │
│      ├─ id (PK)                                                  │
│      ├─ event_id, location_id (FKs)                             │
│      ├─ tenant_id (FK, indexed)                                  │
│      ├─ start_time, end_time, slot_label                        │
│      ├─ capacity, registered_count                              │
│      └─ Indices: (tenant_id), (event_id), (location_id)        │
│                                                                   │
│  Migrations                                                      │
│  └─ 0016_add_gifting_support.py (upgrade/downgrade logic)      │
│                                                                   │
└────────────────────────────────────────────────────────────────────┘
```

## Wizard Flow Diagram

### Annual Day Event Flow
```
                    ┌─────────────────┐
                    │   START WIZARD  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
    ┌──────────────►│  STEP 1: Budget  │──────────────┐
    │              └──────────────────┘              │
    │ Previous                                  Next │
    │              ┌──────────────────┐              │
    ├──────────────│ STEP 2: Event Info│──────────────┤
    │              └──────────────────┘              │
    │              (Event Type: ANNUAL_DAY selected) │
    │                      ↓                         │
    │              ┌──────────────────┐              │
    ├──────────────│ STEP 3: Options  │◄─────────────┤
    │              │ (Tracks & Tasks) │              │
    │              └──────────────────┘              │
    │                                                │
    │              ┌──────────────────┐              │
    └─────────────►│ STEP 4: Review   │              │
                   │ & Submit         │              │
                   └────────┬─────────┘              │
                            │                        │
                   ┌────────▼────────┐               │
                   │ EVENT CREATED! │
                   │ Redirect to    │
                   │ Event Details  │
                   └────────────────┘
```

### Gifting Event Flow
```
                    ┌─────────────────┐
                    │   START WIZARD  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
    ┌──────────────►│  STEP 1: Budget  │──────────────┐
    │              └──────────────────┘              │
    │ Previous                                  Next │
    │              ┌──────────────────┐              │
    ├──────────────│ STEP 2: Event Info│──────────────┤
    │              └──────────────────┘              │
    │              (Event Type: GIFTING selected)    │
    │                      ↓                         │
    │              ┌──────────────────┐              │
    ├──────────────│ STEP 3: Gifts    │◄─────────────┤
    │              │ (with images)    │              │
    │              └──────────────────┘              │
    │                      ↓                         │
    │              ┌──────────────────┐              │
    ├──────────────│ STEP 4: Scheduling│◄────────────┤
    │              │ (Locations, Slots)│             │
    │              └──────────────────┘              │
    │                      ↓                         │
    │              ┌──────────────────┐              │
    ├──────────────│ STEP 5: Review   │◄─────────────┤
    │              │ & Submit         │              │
    │              └────────┬─────────┘              │
    │                       │                        │
    │    ┌──────────────────┼──────────────────┐    │
    │    │                  │                  │    │
    │    ▼                  ▼                  ▼    │
    │ Create Event      Create Options   Create Locations
    │   Record          Records (Gifts)  Records
    │    │                  │                  │    │
    │    └──────────────────┼──────────────────┘    │
    │                       │                       │
    │                       ▼                       │
    │           Generate Time Slots               │
    │          (Per Location, Auto)               │
    │                       │                       │
    │                       ▼                       │
    │           All Records Created             │
    │                       │                       │
    │         ┌─────────────▼──────────────┐       │
    │         │   EVENT + SCHEDULE READY   │       │
    │         │   Redirect to              │       │
    │         │   Event Details            │       │
    │         └────────────────────────────┘       │
    │                                               │
    └───────────────────────────────────────────────┘
```

## Data Flow Diagram

### Budget & Event Info Flow
```
┌─────────────────────┐
│  User Input Form    │
│  (Budget Amount)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  useEventWizardForm Hook                │
│  (React State + localStorage)           │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  eventWizardAPI.validateBudget()        │
│  (HTTP POST /step1/budget)              │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  FastAPI Router: event_studio.py        │
│  └─ EventBudgetStep Schema (Validation) │
│  └─ Returns: {status: "COMPLETED"}      │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Frontend: Move to Next Step            │
│  (Save to localStorage)                 │
└─────────────────────────────────────────┘
```

### Gift Image Upload Flow
```
┌──────────────────┐
│  File Selected   │
│  (gift.jpg)      │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  Frontend Validation                   │
│  ├─ Type: startsWith("image/") ✓      │
│  └─ Size: < 5MB ✓                     │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  eventWizardAPI.uploadGiftImage()      │
│  (HTTP POST /upload-gift-image         │
│   FormData: {file})                    │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  FastAPI Router                        │
│  ├─ Validate Content-Type              │
│  ├─ Validate File Size                 │
│  └─ Save to /uploads/gifts/{uuid}.jpg  │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  Response: ImageUploadResponse         │
│  {                                     │
│    file_key: "abc123",                │
│    url: "/uploads/gifts/abc123.jpg",  │
│    size_bytes: 45000,                 │
│    uploaded_at: "2024-01-15T..."      │
│  }                                     │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  Frontend: Update Gift Item            │
│  ├─ gift_image_url = url               │
│  ├─ Show image preview                 │
│  └─ Update localStorage                │
└────────────────────────────────────────┘
```

### Time Slot Generation Flow
```
┌──────────────────────────────────┐
│  User Configures Scheduling      │
│  ├─ Slot Duration: 15 min        │
│  ├─ Persons/Slot: 20             │
│  ├─ Operating Hours: 10-18       │
│  └─ Locations: 2                 │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  SchedulingStep Component             │
│  └─ Calculates & Shows Preview:      │
│     32 slots × 20 people = 640/loc   │
│     640 × 2 locations = 1,280 total  │
└────────┬─────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  User Submits with eventWizardAPI  │
│  └─ POST /submit                   │
│     {                              │
│       slot_generation_config: {...}│
│       pickup_locations: [...]      │
│     }                              │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  FastAPI: event_studio.py          │
│  POST /submit endpoint             │
│  └─ Validate config                │
│  └─ Create Event                   │
│  └─ Create EventOptions            │
│  └─ Create EventPickupLocations    │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  SchedulingEngine Service          │
│  └─ For each location:             │
│     ├─ Call generate_time_slots()  │
│     │  (creates 32 TimeSlotData)   │
│     ├─ Call create_time_slots()    │
│     │  (INSERT 32 rows per loc)    │
│     └─ Result: 64 time slots total │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Database Transaction Commits      │
│  ✓ Event created                  │
│  ✓ Gifts added as options         │
│  ✓ 2 locations created            │
│  ✓ 64 time slots generated        │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Response: EventWizardResponse     │
│  {                                 │
│    event_id: "uuid",              │
│    name: "Year-End Gifting",      │
│    total_time_slots: 64            │
│  }                                 │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Frontend: Redirect                │
│  └─ window.location.href =         │
│     `/events/{event_id}`           │
└────────────────────────────────────┘
```

## Component Relationship Diagram

```
EventStudioWizard (Main Container)
    ├─ State: currentStep, loading, error
    ├─ Hook: useEventWizardForm
    │   └─ State: formData, errors, touched
    │   └─ Methods: updateFormData, validateStep
    ├─ Service: eventWizardAPI
    │   ├─ validateBudget()
    │   ├─ validateEventInfo()
    │   ├─ validateAnnualDayOptions()
    │   ├─ validateGiftingOptions()
    │   ├─ uploadGiftImage()
    │   ├─ validateScheduling()
    │   └─ submitEvent()
    │
    ├─ Conditional Render
    │   ├─ Step 1 → BudgetStep
    │   │   ├─ Props: data, onChange
    │   │   └─ Emits: onChange event
    │   ├─ Step 2 → BasicInfoStep
    │   │   ├─ Props: data, onChange
    │   │   └─ Features: Event type selector
    │   ├─ Step 3A → OptionsStep (Annual Day)
    │   │   ├─ Props: data, eventType, onChange
    │   │   └─ Features: Add/remove tracks & tasks
    │   ├─ Step 3B → OptionsStep (Gifting)
    │   │   ├─ Props: data, eventType, onChange, onImageUpload
    │   │   └─ Features: Image upload per gift
    │   ├─ Step 4 → SchedulingStep (Gifting) OR ReviewStep (Annual Day)
    │   └─ Step 5 → ReviewStep (Gifting)
    │
    └─ Methods
        ├─ handleNext() → validateCurrentStep()
        ├─ handlePrevious()
        ├─ handleImageUpload()
        └─ handleSubmitWizard()
```

## Database Relationship Diagram

```
Event (Existing)
├─ id
├─ tenant_id
├─ name, description
├─ event_type: "ANNUAL_DAY" | "GIFTING"
├─ budget_amount, budget_committed
├─ Created: Phase 1
└─ Relationships:
   ├─ event_options (One-to-Many)
   └─ event_pickup_locations (One-to-Many, NEW)

EventOption (Extended)
├─ id
├─ event_id (FK)
├─ tenant_id
├─ option_type: "TRACK" | "TASK" | "GIFT" | "VOLUNTEER"
├─ option_name, cost_per_unit
├─ gift_image_url (NEW field)
├─ Created: Phase 1, Extended: Phase 2
└─ Relationships:
   └─ event (Many-to-One)

EventPickupLocation (NEW)
├─ id
├─ event_id (FK)
├─ tenant_id
├─ location_name, location_code, floor_number, building, capacity
├─ Created: Phase 2
└─ Relationships:
   ├─ event (Many-to-One)
   └─ event_time_slots (One-to-Many)

EventTimeSlot (NEW)
├─ id
├─ location_id (FK)
├─ event_id (FK)
├─ tenant_id
├─ start_time, end_time, slot_label
├─ capacity, registered_count
├─ computed: available_capacity = capacity - registered_count
├─ Created: Phase 2
└─ Relationships:
   └─ location (Many-to-One)
```

## State Management Visualization

```
Form Data (localStorage + React State)
│
├─ Step 1 (Budget)
│  ├─ event_budget_amount: number
│  ├─ cost_type: "CURRENCY" | "POINTS"
│  └─ budget_description: string
│
├─ Step 2 (Event Info)
│  ├─ name: string
│  ├─ description: string
│  ├─ event_type: "ANNUAL_DAY" | "GIFTING"  ◄─ Determines remaining steps
│  ├─ registration_start_date: datetime
│  ├─ registration_end_date: datetime
│  └─ event_date: datetime
│
├─ Step 3A (Options - Annual Day)
│  ├─ tracks: Array
│  │  └─ {track_name, total_slots, duration_minutes, description}
│  └─ volunteer_tasks: Array
│     └─ {task_name, required_volunteers, duration_minutes, description}
│
├─ Step 3B (Options - Gifting)
│  └─ gift_items: Array
│     └─ {item_name, total_quantity, unit_cost, gift_image_url, description}
│
└─ Step 4 (Scheduling - Gifting Only)
   ├─ pickup_locations: Array
   │  └─ {location_name, location_code, floor_number, building, capacity}
   └─ slot_generation_config: Object
      ├─ slot_duration_minutes: number
      ├─ persons_per_slot: number
      ├─ operating_start_hour: number
      └─ operating_end_hour: number

Errors Object (React State)
├─ event_budget_amount: string | undefined
├─ cost_type: string | undefined
├─ name: string | undefined
├─ event_type: string | undefined
├─ [field_name]: error message...

Touched Object (React State)
├─ event_budget_amount: boolean
├─ name: boolean
├─ [field_name]: boolean...
```

---

This visual guide helps understand the complete architecture, data flow, and relationships in Phase 2 implementation.
