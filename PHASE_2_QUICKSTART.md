# Phase 2: Event Studio - Quick Start Guide

## What is Phase 2?

Phase 2 delivers the **Event Studio Wizard** - an interactive, multi-step wizard that guides tenant admins through creating events with:

- **Dedicated Budget Management**: Separate "Event Wallet" for each event
- **Mode Selection**: Choose between Annual Day (performance tracks) or Gifting (gift distribution)
- **Smart Scheduling**: Auto-generate pickup time slots with configurable capacity
- **Image Support**: Upload gift item images with automatic validation
- **Progressive Enhancement**: Step-by-step validation guides users through the process

## Quick Start: Using the Wizard

### 1. Access the Wizard
Navigate to `/events/wizard` in your browser (admin-only feature)

### 2. Follow the Steps

#### Step 1: Budget Loading 💰
1. Enter the event budget amount (₹)
2. Select cost type: CURRENCY or POINTS
3. Add optional budget description
4. Click "Next" to validate and proceed

#### Step 2: Event Details 📋
1. Enter event name (required)
2. Add event description (optional)
3. **Select event type** - This determines the remaining steps:
   - **Annual Day 🎭**: Performance tracks + volunteer tasks
   - **Gifting 🎁**: Gift items with pickup locations
4. Set dates:
   - Registration Start Date
   - Registration End Date
   - Event Date
5. Click "Next"

#### Step 3: Configure Options 🎭/🎁
This step changes based on your event type:

**For Annual Day Events:**
- Add Performance Tracks (e.g., Dance, Music, Drama)
  - Track name, number of slots, duration, description
- Add Volunteer Tasks (e.g., Stage Setup, Ushering)
  - Task name, volunteers needed, duration, description
- Add at least 1 track OR 1 task

**For Gifting Events:**
- Add Gift Items
  1. Enter gift name (e.g., "Corporate Mug")
  2. **Upload gift image** (JPEG, PNG, WebP - max 5MB)
  3. Set quantity available
  4. Set unit cost in ₹
  5. Add description
- Add at least 1 gift
- System shows: Total gifts, total value

#### Step 4: Scheduling ⏰ (Gifting Only)
*This step only appears for Gifting events*

1. **Configure Time Slots**:
   - Slot Duration: 5-60 minutes (usually 15)
   - Persons Per Slot: Max people per time window (usually 20)
   - Operating Hours: When gift pickup available (e.g., 10:00 AM - 6:00 PM)
   - System calculates: Expected 32 slots/location with preview

2. **Add Pickup Locations**:
   - Location name (e.g., "Conference Room 402")
   - Location code (e.g., "CONF-402")
   - Floor number, building
   - Physical capacity
   - Add multiple locations for distributed pickup

3. Summary shows: Total locations, total slots, total capacity

#### Step 5: Review ✓ (Annual Day Step 4)
1. Review entire configuration:
   - Budget details
   - Event info and dates
   - Tracks/Tasks/Gifts (with images for gifts)
   - Pickup locations (for gifting)
   - Time slot configuration (for gifting)

2. Verify everything is correct

3. Click "Create Event" to submit

### 3. Success!
After submission:
- Event is created with all configuration
- Time slots are auto-generated (for gifting)
- You're redirected to the event details page
- Event is ready for employees to register

## Features Explained

### 💾 Auto-Save
Your progress is automatically saved to browser's localStorage. Close and return anytime before final submission to resume.

### ✅ Smart Validation
Each step validates your input before allowing progression. Error messages explain what needs to be fixed.

### 🎨 Conditional UI
The wizard adapts based on your event type choice:
- Select "Annual Day" → Get track/task configuration
- Select "Gifting" → Get gift items + scheduling

### 📸 Image Upload
For gifting events:
- Click "Upload" button on each gift
- Select JPEG, PNG, or WebP image (max 5MB)
- Image previews immediately
- Can change image by uploading new one

### ⏱️ Smart Time Slot Calculation
For gifting events:
- System auto-calculates available slots
- Example: 10 AM - 6 PM (8 hours) with 15-min slots = 32 time windows
- 20 people/slot × 32 slots × 2 locations = 1,280 total capacity

## Common Use Cases

### Use Case 1: Annual Day Event
```
Budget: ₹50,000 (CURRENCY)
Event: "Annual Day 2024" (ANNUAL_DAY)
Dates: Jan 15-20 (registration), Jan 25 (event)
Tracks: Dance (20 slots), Music (15 slots), Drama (10 slots)
Volunteers: Stage Setup (5 needed), Ushering (8 needed)
Result: Event ready for departments to register performers
```

### Use Case 2: Gifting Program
```
Budget: ₹1,00,000 (CURRENCY)
Event: "Year-End Gifting 2024" (GIFTING)
Gifts:
  - Corporate Mug (₹200 × 100)
  - Premium Backpack (₹500 × 50)
  - Desktop Plant (₹150 × 75)
Locations:
  - Conference Room 402 (32 slots × 20 people = 640)
  - Main Lobby (32 slots × 20 people = 640)
Time Slots: 10 AM - 6 PM (8 hours), 15-min slots, 20 people each
Result: Event ready, employees can pick slots to receive gifts
```

## Troubleshooting

### "Budget validation failed"
- Ensure budget amount > 0
- Ensure cost type is selected (CURRENCY or POINTS)

### "Registration end date must be after start"
- The registration end date must come AFTER the start date
- Example: Start Jan 15, End Jan 20 ✓ (not Start Jan 20, End Jan 15 ✗)

### "Event date must be after registration end"
- The event must happen AFTER registration closes
- This prevents registration closing after event starts
- Example: Reg ends Jan 20, Event Jan 25 ✓

### "At least one gift must have an image"
- Each gift item requires a valid image
- Click "Upload" and select an image file
- Supported formats: JPEG, PNG, WebP (max 5MB)

### "Time slot configuration invalid"
- Ensure end hour > start hour (e.g., start 10, end 18)
- Ensure slot duration 5-60 minutes
- System must generate at least 1 slot

### "Form lost when I refreshed"
- Your progress was auto-saved! Check the form fields
- If still lost, your localStorage might be cleared
- Restart from Step 1 (budget amounts are usually memorable)

## Advanced Features

### localStorage Auto-Save
Your wizard progress persists across browser sessions:
- Budget, event info, options, scheduling - all saved
- Survives page refreshes and browser close/reopen
- Cleared after final submission
- Can manually clear browser cache to reset

### Image Upload Validation
For gift images:
- **File Type**: Must be image (JPEG, PNG, WebP)
- **Size**: Maximum 5MB
- **Storage**: Images saved to `/uploads/gifts/`
- **Response**: Get image URL immediately for preview

### Progressive Validation
Each step validates independently:
- Budget validation: checks amount > 0
- Event info validation: checks dates are logical
- Options validation: checks at least 1 item
- Scheduling validation: checks slot config is valid

No validation crosses to next step until current is valid.

## Data Structure (For Developers)

### Form Data Structure
```javascript
{
  // Step 1
  event_budget_amount: 50000,
  cost_type: "CURRENCY",
  budget_description: "Event budget",

  // Step 2
  name: "Annual Day 2024",
  description: "Company celebration",
  event_type: "ANNUAL_DAY",
  registration_start_date: "2024-01-15T00:00",
  registration_end_date: "2024-01-20T23:59",
  event_date: "2024-01-25T09:00",

  // Step 3 - Annual Day
  tracks: [
    { track_name: "Dance", total_slots: 20, duration_minutes: 30, description: "" }
  ],
  volunteer_tasks: [
    { task_name: "Setup", required_volunteers: 5, duration_minutes: 60, description: "" }
  ],

  // Step 3 - Gifting
  gift_items: [
    { 
      item_name: "Mug", 
      total_quantity: 100, 
      unit_cost: 200, 
      gift_image_url: "/uploads/gifts/abc123.jpg",
      description: "Corporate mug"
    }
  ],

  // Step 4 - Gifting only
  pickup_locations: [
    { location_name: "Conf Room 402", location_code: "CONF-402", floor_number: "4", building: "Tower A", capacity: 50 }
  ],
  slot_generation_config: {
    slot_duration_minutes: 15,
    persons_per_slot: 20,
    operating_start_hour: 10,
    operating_end_hour: 18
  }
}
```

## API Endpoints (For Integration)

All endpoints require `Authorization: Bearer TOKEN` header.

```
POST   /api/v1/events/wizard/step1/budget              Validate budget
POST   /api/v1/events/wizard/step2/event-info          Validate event info
POST   /api/v1/events/wizard/step3/options/annual-day  Validate annual day options
POST   /api/v1/events/wizard/step3/options/gifting     Validate gifting options
POST   /api/v1/events/wizard/upload-gift-image         Upload gift image
POST   /api/v1/events/wizard/step4/scheduling          Validate scheduling (gifting only)
POST   /api/v1/events/wizard/submit                    Create event
GET    /api/v1/events/wizard/events/{id}/preview       Get event details
```

## Next Steps

After creating an event, you can:
1. **View Event Details**: See full configuration, registrations, budget tracking
2. **Enable Registrations**: Activate registration for employees
3. **Track Budget**: Monitor committed vs available budget
4. **View Registrations**: See who registered for tracks/gifts
5. **Generate Reports**: Analytics on participation and budget usage

---

**Need Help?** Refer to [PHASE_2_EVENT_STUDIO.md](PHASE_2_EVENT_STUDIO.md) for complete technical documentation.
