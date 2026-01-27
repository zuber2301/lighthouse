# Phase 4 Integration Guide

## Quick Integration: Event Wizard → Approval Workflow

This guide shows how to integrate Phase 4 approvals into the existing Phase 2 Event Wizard.

---

## Step 1: Update EventOption Model

Add impact hours tracking to `EventOption`:

```python
# backend/app/models/events.py

class EventOption(Base, TenantMixin, TimestampMixin):
    # ... existing fields
    
    # NEW: Impact tracking for Phase 4
    impact_hours_per_week = Column(Numeric(5, 2), nullable=True)  # e.g., 3.5h/week
    impact_duration_weeks = Column(Integer, nullable=True)        # e.g., 8 weeks
```

Then add a database migration:

```python
# backend/migrations/versions/0018_add_impact_hours.py

def upgrade() -> None:
    op.add_column('event_options', 
        sa.Column('impact_hours_per_week', sa.Numeric(5, 2), nullable=True))
    op.add_column('event_options',
        sa.Column('impact_duration_weeks', sa.Integer(), nullable=True))

def downgrade() -> None:
    op.drop_column('event_options', 'impact_duration_weeks')
    op.drop_column('event_options', 'impact_hours_per_week')
```

---

## Step 2: Update Event Wizard Schema

Add impact hours to the event creation schema:

```python
# backend/app/schemas/event_wizard.py

class EventOptionCreate(BaseModel):
    option_name: str
    option_type: str  # "TRACK", "INVENTORY", "GIFT"
    description: Optional[str] = None
    total_available: int
    cost_per_unit: Optional[Decimal] = None
    gift_image_url: Optional[str] = None
    
    # NEW: Impact hours for Phase 4
    impact_hours_per_week: Optional[float] = None    # e.g., 3.5
    impact_duration_weeks: Optional[int] = None      # e.g., 8
```

---

## Step 3: Modify Event Wizard Flow

Update the event registration endpoint to create approval requests:

```python
# backend/app/api/event_studio.py

@router.post("/register")
async def register_for_event(
    event_id: str,
    option_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Register for event.
    Now creates approval request instead of direct registration.
    """
    from app.services.approval_service import ApprovalService
    
    # Validate event and option
    event = await db.get(Event, event_id)
    option = await db.get(EventOption, option_id)
    
    if not event or not option:
        raise HTTPException(status_code=404, detail="Event or option not found")
    
    # If option requires approval (has impact hours), create approval request
    if option.impact_hours_per_week and option.impact_duration_weeks:
        approval_req = await ApprovalService.create_approval_request(
            db=db,
            request_data=ApprovalRequestCreate(
                event_option_id=option.id,
                impact_hours_per_week=option.impact_hours_per_week,
                impact_duration_weeks=option.impact_duration_weeks,
                notes=f"Auto-created from event registration for {event.name}",
            ),
            event_id=event_id,
            user_id=current_user.id,
            tenant_id=current_user.tenant_id,
        )
        await db.commit()
        
        return {
            "status": "PENDING_APPROVAL",
            "message": f"Your request has been sent to your lead for approval",
            "approval_request_id": approval_req.id,
            "impact_hours": float(option.impact_hours_per_week),
        }
    
    # If no impact hours required, create direct registration (no approval needed)
    else:
        registration = EventRegistration(
            event_id=event_id,
            user_id=current_user.id,
            event_option_id=option.id,
            status=RegistrationStatus.APPROVED,  # Auto-approved
            amount_committed=option.cost_per_unit or Decimal("0"),
        )
        db.add(registration)
        await db.commit()
        
        return {
            "status": "APPROVED",
            "message": "You're registered!",
            "registration_id": registration.id,
        }
```

---

## Step 4: Update Event Wizard UI

Modify the event registration flow in frontend:

```jsx
// frontend/src/components/EventStudio/EventWizard.jsx

function EventWizardFinal({ event, selectedOption, onSubmit }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/events/${event.id}/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': sessionStorage.getItem('tenant_id'),
          },
          body: JSON.stringify({
            option_id: selectedOption.id,
          }),
        }
      );

      const data = await response.json();
      setResult(data);

      if (data.status === 'PENDING_APPROVAL') {
        // Show pending message
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 mb-2">
              ⏳ Awaiting Approval
            </h3>
            <p className="text-blue-800 mb-4">
              Your request to join {selectedOption.option_name} has been sent
              to your lead for approval.
            </p>
            <p className="text-blue-700 text-sm mb-4">
              ⏱️ Impact: {selectedOption.impact_hours_per_week}h/week ×{' '}
              {selectedOption.impact_duration_weeks} weeks
            </p>
            <p className="text-blue-600 text-xs">
              You'll receive an email once your lead reviews your request.
            </p>
          </div>
        );
      } else if (data.status === 'APPROVED') {
        // Show approved message
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-bold text-green-900 mb-2">
              ✓ You're Registered!
            </h3>
            <p className="text-green-800">
              Welcome to {selectedOption.option_name}! See you at the event.
            </p>
          </div>
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      setResult({ status: 'ERROR', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return <RegistrationResult result={result} />;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">Confirm Registration</h3>
      
      {/* Impact Display */}
      {selectedOption.impact_hours_per_week && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-orange-900">
            ⏱️ Time Commitment
          </p>
          <p className="text-lg font-bold text-orange-600 mt-1">
            {selectedOption.impact_hours_per_week}h/week ×{' '}
            {selectedOption.impact_duration_weeks} weeks
          </p>
          <p className="text-sm text-orange-700 mt-2">
            = {selectedOption.impact_hours_per_week * selectedOption.impact_duration_weeks}h total
          </p>
          <p className="text-xs text-orange-600 mt-3">
            ℹ️ Your lead will review and approve this commitment
          </p>
        </div>
      )}

      {/* Registration Button */}
      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                   text-white rounded-lg font-semibold transition"
      >
        {loading ? 'Submitting...' : 'Request to Join'}
      </button>
    </div>
  );
}
```

---

## Step 5: Create Lead Dashboard Tab

Add the RequestsTab to the lead's dashboard:

```jsx
// frontend/src/components/Dashboard/LeadDashboard.jsx

import RequestsTab from '../RequestsTab';

export function LeadDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6">
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'overview'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'requests'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Approval Requests
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'events'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Events
        </button>
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'requests' && <RequestsTab />}  {/* ← NEW */}
      {activeTab === 'events' && <EventsTab />}
    </div>
  );
}
```

---

## Step 6: Apply Database Migrations

```bash
cd backend

# Apply Phase 4 approval table
python3 -m alembic upgrade 0017_add_approvals

# Apply impact hours to EventOption
python3 -m alembic upgrade 0018_add_impact_hours
```

---

## Step 7: Test the Integration

### Test 1: Create Event with Impact Hours
```bash
POST /event-studio/create
{
  "name": "Annual Day",
  "options": [
    {
      "option_name": "Standup Comedy",
      "option_type": "TRACK",
      "total_available": 20,
      "impact_hours_per_week": 3.5,
      "impact_duration_weeks": 8
    }
  ]
}
```

### Test 2: Register for Event (Triggers Approval)
```bash
POST /events/{event_id}/register
{
  "option_id": "{option_id}"
}

Response:
{
  "status": "PENDING_APPROVAL",
  "message": "Your request has been sent to your lead for approval",
  "impact_hours": 3.5
}
```

### Test 3: Lead Reviews Requests
```bash
GET /approvals/pending

Response:
{
  "pending_count": 1,
  "total_pending_impact_hours": 28,
  "requests": [
    {
      "id": "req-123",
      "user_name": "Alex",
      "event_name": "Annual Day",
      "option_name": "Standup Comedy",
      "impact_hours_per_week": 3.5,
      "total_impact_hours": 28,
      "status": "PENDING"
    }
  ]
}
```

### Test 4: Lead Approves Request
```bash
POST /approvals/req-123/approve
{
  "decision": "APPROVE",
  "notes": "Great initiative!"
}

Response:
{
  "id": "req-123",
  "status": "APPROVED",
  "qr_code_url": "data:image/png;base64,..."
}
```

---

## Step 8: Email Notifications

Verify emails are being sent:

```bash
# Check uploads/ folder for notification emails
ls -lah backend/uploads/ | grep notification

# Or configure SMTP:
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your-email@gmail.com
export SMTP_PASS=your-app-password
export FROM_EMAIL=noreply@yourcompany.com
```

---

## Architecture Diagram

```
User selects event + track
        ↓
    EventWizard.register()
        ↓
    [Decision Point]
        ├─ Has impact_hours → ApprovalService.create_approval_request()
        │      ↓
        │   ApprovalRequest created (status=PENDING)
        │      ↓
        │   Lead gets notification
        │      ↓
        │   Lead reviews in RequestsTab
        │      ↓
        │   ├─ APPROVE → QR generated, budget committed
        │   │   EventRegistration.status = APPROVED
        │   │   Send confirmation email
        │   │
        │   └─ DECLINE → Alternatives found
        │       EventRegistration.status = REJECTED
        │       Send decline email with alternatives
        │
        └─ No impact_hours → EventRegistration created (auto-approved)
```

---

## Configuration Options

### Threshold for Approval

Make approval automatic if impact is below threshold:

```python
# backend/app/api/event_studio.py

APPROVAL_THRESHOLD_HOURS = 10  # Hours per week

if (option.impact_hours_per_week and 
    option.impact_hours_per_week > APPROVAL_THRESHOLD_HOURS):
    # Requires approval
    create_approval_request()
else:
    # Auto-approve
    create_registration(auto_approved=True)
```

### Default Impact Hours

If not specified, use defaults:

```python
DEFAULT_IMPACT_HOURS = {
    "TRACK": 3.5,      # Track participations: 3.5h/week
    "INVENTORY": 0,    # Physical items: no time impact
    "GIFT": 0,         # Gifts: no time impact
}

impact = option.impact_hours_per_week or DEFAULT_IMPACT_HOURS[option.option_type]
```

---

## Troubleshooting

### Problem: QR codes not generating
**Solution**: Check `qrcode` package is installed
```bash
pip install qrcode[pil]
```

### Problem: Emails not sending
**Solution**: Check notifications in `uploads/`
```bash
cat backend/uploads/notification-*.html
```

### Problem: Lead's inbox empty
**Solution**: Verify lead_id assignment in ApprovalService
```python
# Check user has ADMIN/MANAGER role
SELECT * FROM users WHERE tenant_id='...' AND role IN ('ADMIN', 'MANAGER');
```

---

## Next Steps

1. ✅ **Today**: Deploy Phase 4 (approval models, APIs, frontend)
2. ✅ **Today**: Apply migration 0017_add_approvals
3. 📝 **Tomorrow**: Test approval workflow end-to-end
4. 📝 **Day 3**: Configure SMTP for production emails
5. 📝 **Day 4**: Train leads on approval process
6. 📝 **Day 5**: Go live with Phase 4!

---

**Questions?** Check PHASE_4_GOVERNANCE_LOOP.md for full details.
