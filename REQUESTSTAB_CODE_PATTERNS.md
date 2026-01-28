# RequestsTab.jsx - Technical Reference & Code Patterns

## 🔧 Implementation Patterns

This document provides exact code patterns used in RequestsTab.jsx that can be replicated across the application.

---

## 1. Action Buttons Pattern

### Approve/Success Button
```jsx
<button
  onClick={() => onApprove(request.id)}
  disabled={loading}
  className="px-4 py-2 bg-success hover:opacity-90 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition duration-200"
>
  Approve
</button>
```

**CSS Variables Used:**
- `bg-success` → `#16a34a` (green in light theme)
- Text: `text-white` (good contrast against success color)

**Interaction States:**
- Default: Green button
- Hover: Slightly faded (`opacity-90`)
- Disabled: Faded (`opacity-50`)
- Transition: Smooth 200ms fade

---

### Decline/Error Button
```jsx
<button
  onClick={() => onDecline(request.id)}
  disabled={loading}
  className="px-4 py-2 bg-error hover:opacity-90 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition duration-200"
>
  Decline
</button>
```

**CSS Variables Used:**
- `bg-error` → `#dc2626` (red in light theme)
- Text: `text-white` (good contrast)

---

### Secondary/Surface Button
```jsx
<button
  onClick={() => onViewDetails(request.id)}
  className="px-4 py-2 bg-surface border border-border-soft hover:bg-border-soft text-text-main rounded-lg text-sm font-medium transition duration-200"
>
  View Details
</button>
```

**CSS Variables Used:**
- `bg-surface` → `#f9f9f9` (off-white)
- `border-border-soft` → `#d4d4d4` (light grey)
- `text-text-main` → `#333333` (dark grey)

**Interaction States:**
- Default: Light background with border
- Hover: Slightly darker background (`border-soft` color)
- Smooth transition: 200ms

---

## 2. Card Container Pattern

### Standard Card with Shadow Depth
```jsx
<div className="bg-card border border-border-soft rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
  {/* Card content */}
</div>
```

**CSS Variables Used:**
- `bg-card` → `#ffffff` (white)
- `border-border-soft` → `#d4d4d4` (light grey)

**Shadow Elevation:**
- Default: `shadow-md` (4px vertical, 6px blur)
- Hover: `shadow-lg` (8px vertical, 12px blur)
- Transition: `duration-200` (smooth 200ms)

---

### Surface Card (Secondary Background)
```jsx
<div className="mb-6 p-4 bg-surface rounded-lg border border-border-soft">
  {/* Surface content */}
</div>
```

**CSS Variables Used:**
- `bg-surface` → `#f9f9f9` (off-white)
- `border-border-soft` → `#d4d4d4`

**Use Cases:**
- Secondary information blocks
- Detail sections within modals
- Alternative content areas

---

## 3. Text Hierarchy Pattern

### Primary Text (Headers, Labels)
```jsx
<h2 className="text-2xl font-bold text-text-main">
  Approval Inbox
</h2>

<p className="font-semibold text-text-main">
  {request.user_name}
</p>
```

**CSS Variables:**
- `text-text-main` → `#333333` (dark grey)
- Font weight: `bold` or `semibold`

---

### Secondary Text (Descriptions)
```jsx
<p className="text-text-secondary">
  Review and approve pending requests...
</p>

<p className="text-sm text-text-secondary">
  {request.user_email}
</p>
```

**CSS Variables:**
- `text-text-secondary` → `#666666` (medium grey)
- Font size: `text-sm` or inherit

---

### Accent Text (Highlights)
```jsx
<span className="text-accent font-semibold">
  = {request.total_impact_hours}h total
</span>

<p className="text-3xl font-bold text-accent">
  {requests.length}
</p>
```

**CSS Variables:**
- `text-accent` → `#7C3AED` (purple)
- Usage: Numbers, important metrics

---

## 4. Modal Pattern

### Modal Container with Backdrop
```jsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
  <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border-soft shadow-2xl">
    {/* Modal content */}
  </div>
</div>
```

**Key Features:**
- `fixed inset-0` - Full screen overlay
- `bg-black bg-opacity-50` - Darkened backdrop
- `backdrop-blur-sm` - Glass-morphism effect
- `z-50` - Proper stacking order
- `shadow-2xl` - Elevated appearance
- `max-h-[90vh]` - Scrollable if too tall
- `border border-border-soft` - Definition

---

### Modal Header (Sticky)
```jsx
<div className="sticky top-0 bg-card border-b border-border-soft p-6 flex justify-between items-center">
  <h3 className="text-xl font-bold text-text-main">
    Approval Request Details
  </h3>
  <button
    onClick={onClose}
    className="text-text-secondary hover:text-text-main transition duration-200 p-1 rounded hover:bg-surface"
  >
    ✕
  </button>
</div>
```

**Features:**
- `sticky top-0` - Stays visible while scrolling
- `border-b border-border-soft` - Separation from content
- Close button with full interaction (color + background)

---

### Modal Content
```jsx
<div className="p-6">
  {/* Main content area */}
</div>
```

**Padding:** `p-6` (24px) for breathing room

---

## 5. Form Input Pattern

### Text Input
```jsx
<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="user@example.com"
  className="w-full border border-border-soft rounded-lg p-3 text-sm text-text-main bg-card focus:outline-none focus:ring-2 focus:ring-accent"
/>
```

**CSS Variables:**
- `bg-card` → `#ffffff` (white)
- `border-border-soft` → `#d4d4d4` (light grey)
- `text-text-main` → `#333333` (dark grey)
- Focus ring: `focus:ring-accent` → `#7C3AED` (purple)

---

### Textarea
```jsx
<textarea
  value={actionNotes}
  onChange={(e) => onNotesChange(e.target.value)}
  placeholder="Add any notes about your decision..."
  className="w-full border border-border-soft rounded-lg p-3 text-sm text-text-main bg-card focus:outline-none focus:ring-2 focus:ring-accent"
  rows="3"
/>
```

**Same Variables as Text Input**

---

## 6. Badge Pattern

### Accent Badge
```jsx
<span className="inline-block bg-accent bg-opacity-10 text-accent text-xs font-semibold px-3 py-1 rounded-full">
  {request.impact_hours_per_week}h/week × {request.impact_duration_weeks} weeks
</span>
```

**CSS Variables:**
- `bg-accent` → `#7C3AED` (purple)
- `bg-opacity-10` → 10% opacity (light purple background)
- `text-accent` → Full opacity purple text

**Use Cases:**
- Highlighting important metrics
- Status indicators
- Tags

---

## 7. Stats Card Pattern

### Standard Stats Card
```jsx
<div className="bg-surface rounded-lg p-4 border border-border-soft">
  <p className="text-text-secondary text-sm">Pending Requests</p>
  <p className="text-3xl font-bold text-accent">{requests.length}</p>
</div>
```

**Components:**
- Label: `text-text-secondary` (secondary color)
- Number: `text-3xl font-bold text-accent` (large, accent color)

**Multiple Cards Use Same Pattern:**
All stats cards should have identical styling for consistency

---

## 8. Link/Action Pattern

### Text Link with Hover
```jsx
<button
  onClick={() => handleAction(item.id)}
  className="text-accent hover:underline transition duration-200 cursor-pointer"
>
  View More
</button>
```

**Interaction:**
- Default: `text-accent` (purple)
- Hover: `hover:underline` (underlined)
- Smooth: `duration-200`

---

## 9. Error Message Pattern

### Error Alert
```jsx
<div className="mb-6 p-4 bg-surface border border-error rounded-lg">
  <h4 className="font-semibold text-error mb-2">Request Declined</h4>
  <p className="text-error text-sm">
    {request.decline_reason || 'The request has been declined.'}
  </p>
</div>
```

**CSS Variables:**
- `bg-surface` → Off-white background
- `border-error` → Red border
- `text-error` → `#dc2626` (red text)

---

## 10. Info Message Pattern

### Info/Instructions Box
```jsx
<div className="bg-surface border border-accent border-opacity-30 rounded-lg p-4 text-left">
  <h5 className="font-semibold text-text-main mb-2">Next Steps</h5>
  <ul className="text-sm text-text-secondary space-y-1">
    <li>✓ An email with the QR code has been sent</li>
    <li>✓ User should save/print the QR code</li>
  </ul>
</div>
```

**CSS Variables:**
- `bg-surface` → `#f9f9f9` (off-white)
- `border-accent border-opacity-30` → Light purple border
- `text-text-main` → Dark grey heading
- `text-text-secondary` → Medium grey list items

---

## 11. Focus State Pattern

### Focus Ring for Accessibility
```jsx
<button className="... focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
  Action Button
</button>
```

**Applied to:**
- All buttons
- All form inputs
- All interactive elements

**Ring Details:**
- `focus:outline-none` - Remove default outline
- `focus:ring-2` - 2px ring width
- `focus:ring-accent` - Purple ring color (`#7C3AED`)
- `focus:ring-offset-2` - 2px white space (offset)

---

## 12. Disabled State Pattern

### Opacity-Based Disabled
```jsx
<button
  disabled={isLoading}
  className="... bg-success hover:opacity-90 disabled:opacity-50 ..."
>
  Approve
</button>
```

**Why Opacity?**
- Works with ANY color (success, error, surface)
- Maintains color relationship
- Works across ALL themes
- Universal accessibility pattern

**Not Color-Based:**
```jsx
// ❌ DON'T DO THIS - breaks theme
disabled:bg-gray-400

// ✅ DO THIS - universal
disabled:opacity-50
```

---

## 13. Hover State Pattern

### Opacity-Based Hover (Buttons)
```jsx
<button className="... bg-success hover:opacity-90 ...">
  Approve
</button>
```

**Result:**
- Default: Full opacity (100%)
- Hover: Slightly faded (90%)
- Feels responsive without color change

---

### Shadow-Based Hover (Cards)
```jsx
<div className="... shadow-md hover:shadow-lg transition-shadow duration-200">
  {/* Card content */}
</div>
```

**Result:**
- Default: Subtle shadow (elevation)
- Hover: Larger shadow (more elevation)
- Smooth transition (200ms)

---

### Background-Based Hover (Secondary Actions)
```jsx
<button className="... text-text-secondary hover:text-text-main hover:bg-surface ...">
  Close
</button>
```

**Result:**
- Default: Text only
- Hover: Text color + background color
- Multiple feedback layers

---

## 14. Loading State Pattern

### Button Loading
```jsx
<button
  disabled={loading}
  className="... disabled:opacity-50 ..."
>
  {loading ? 'Loading...' : 'Approve'}
</button>
```

**Provides:**
- Visual feedback (faded button)
- Text feedback (loading message)
- Prevents double-clicks (disabled)

---

## 15. Spacing Pattern

### Consistent Padding
```jsx
p-4   // Cards
p-3   // Inputs, smaller elements
p-6   // Modal content
px-4  // Horizontal only
py-2  // Vertical only
```

### Consistent Margins
```jsx
mb-3  // Between card sections
mb-6  // Between major sections
mt-1  // Small spacing
gap-2 // Between flex items
```

---

## 16. Border Radius Pattern

### Standard Radius
```jsx
rounded-lg      // Cards, buttons, inputs (8px)
rounded-full    // Badges, pills (9999px)
rounded         // Default (4px)
```

---

## 17. Font Size Pattern

### Text Hierarchy
```jsx
text-xs      // Labels, badges (12px)
text-sm      // Secondary text (14px)
text-base    // Body text (16px) [default]
text-lg      // Small headers (18px)
text-xl      // Headers (20px)
text-2xl     // Main header (24px)
text-3xl     // Large number (30px)
```

---

## 18. Font Weight Pattern

### Weight Usage
```jsx
font-medium   // Labels, secondary text
font-semibold // Important text, badges
font-bold     // Headers, main text
```

---

## CSS Variables Reference

### Complete List
```css
/* Text Colors */
--text-main: #333333;           /* Primary text */
--text-secondary: #666666;      /* Secondary text */

/* Background Colors */
--card-bg: #ffffff;             /* Card backgrounds */
--surface-bg: #f9f9f9;          /* Surface elements */
--primary-bg: #f5f5f5;          /* Primary background */

/* Border Colors */
--border-soft: #d4d4d4;         /* Soft borders */

/* Accent Color */
--accent: #7C3AED;              /* Purple accent */

/* Status Colors */
--success: #16a34a;             /* Green success */
--error: #dc2626;               /* Red error */
--warning: #ca8a04;             /* Yellow warning */
--info: #0891b2;                /* Cyan info */
```

---

## ✅ Implementation Checklist

When implementing theme variables in any component:

- [ ] Replace all `bg-white` with `bg-card`
- [ ] Replace all `bg-gray-50` with `bg-surface`
- [ ] Replace all `text-gray-900` with `text-text-main`
- [ ] Replace all `text-gray-600` with `text-text-secondary`
- [ ] Replace all `border-gray-200` with `border-border-soft`
- [ ] Replace hardcoded button colors with `bg-success`, `bg-error`
- [ ] Replace color-based hover with `hover:opacity-90`
- [ ] Replace color-based disabled with `disabled:opacity-50`
- [ ] Add `focus:ring-2 focus:ring-accent` to interactive elements
- [ ] Set transitions to `duration-200` for smooth interactions
- [ ] Test all states (default, hover, disabled, focus)
- [ ] Verify contrast ratios (7:1+)
- [ ] Test on all 4 themes (light, dim, dark, graph)

---

## 🎯 Pattern Reusability

These patterns can be applied to:

1. **Recognition Components**
   - Recognition cards
   - Achievement badges
   - Leaderboards

2. **Admin Panels**
   - User management
   - Tenant settings
   - Event configuration

3. **Dashboard**
   - Stats cards
   - Activity feeds
   - Summary metrics

4. **Forms**
   - Input fields
   - Textareas
   - Selects

5. **Modals**
   - Confirmation dialogs
   - Detail views
   - Edit forms

---

## 📚 Additional Resources

- [theme.js](../frontend/src/lib/theme.js) - Theme constants
- [index.css](../frontend/src/index.css) - CSS variables
- [LIGHT_THEME_GUIDE.md](./LIGHT_THEME_GUIDE.md) - Complete guide
- [RequestsTab.jsx](../frontend/src/components/RequestsTab.jsx) - Live example

---

**Last Updated**: Current Session  
**Status**: ✅ Complete Reference  
**Component**: RequestsTab.jsx  
**Quality**: Production Ready
