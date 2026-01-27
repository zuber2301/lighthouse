# Lighthouse API Endpoints Documentation

This document outlines all available endpoints in the Lighthouse recognition and rewards platform API.

## Table of Contents

1. [Authentication](#authentication)
2. [Recognition](#recognition)
3. [Rewards & Redemptions](#rewards--redemptions)
4. [Badges](#badges)
5. [User Management](#user-management)
6. [Tenant Management](#tenant-management)
7. [Platform Administration](#platform-administration)
8. [Analytics](#analytics)
9. [Dashboard](#dashboard)
10. [Milestones](#milestones)

---

## Authentication

### Health Check
- **`GET /auth/health`** - Check API health status
  - No authentication required

### Login
- **`POST /auth/login`** - Standard login endpoint
  - Body: `{ "email": "string", "password": "string" }`

### Google OAuth
- **`GET /auth/google`** - Initiate Google OAuth flow
  - Redirects to Google login

### OAuth Callback
- **`GET /auth/callback`** - Handle OAuth callback
  - Params: `code`, `state`

### Development Login
- **`POST /auth/dev-login`** - Development login (dev only)
  - Body: `{ "email": "string" }`

### Dev Token
- **`GET /auth/dev-token`** - Generate development JWT token
  - Params: `role` (optional), `tenant_id` (optional)
  - Returns: JWT token

### Impersonate User
- **`POST /auth/impersonate/{user_id}`** - Switch to another user (admin only)
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Returns: New JWT token for the specified user

---

## Recognition

### List Recognitions
- **`GET /recognition/`** - Get all recognitions (paginated)
  - Query Params: `skip`, `limit`, `tenant_id` (optional)
  - Returns: List of recognitions

### Create Recognition
- **`POST /recognition/`** - Send a recognition award
  - Body: 
    ```json
    {
      "nominee_id": "string",
      "award_category": "string",
      "message": "string",
      "ecard_html": "string" (optional),
      "ecard_url": "string" (optional),
      "ecard_design": "string" (optional),
      "is_public": "boolean",
      "area_of_focus": "string" (optional),
      "award_type": "string" (optional),
      "behavior_alignment": "string" (optional),
      "impact_duration": "string" (optional)
    }
    ```

### Recognition Feed
- **`GET /recognition/feed`** - Get social feed of recognitions
  - Returns: Paginated feed of recent recognitions

### Give Check
- **`POST /recognition/give-check`** - Verify recognition data before submitting
  - Body: Recognition data
  - Returns: Validation result

### Approve Recognition
- **`POST /recognition/{rec_id}/approve`** - Approve a pending recognition (admin)
  - Role: TENANT_ADMIN, TENANT_LEAD
  - Returns: Updated recognition

### High-Five Recognition
- **`POST /recognition/{recognition_id}/high-five`** - React to a recognition
  - Body: `{ "reaction": "string" }`
  - Returns: Updated reaction count

### Upload Files
- **`POST /recognition/uploads`** - Upload media for recognition
  - Content-Type: multipart/form-data
  - File field: `file`
  - Returns: `{ "url": "string", "filename": "string" }`

### AI Coach
- **`POST /recognition/coach`** - Get AI-powered suggestions for recognition messages
  - Body: `{ "context": "string" }`
  - Returns: `{ "suggestions": ["string"] }`

---

## Rewards & Redemptions

### List Rewards
- **`GET /rewards/`** - Get all available rewards
  - Query Params: `skip`, `limit`, `tenant_id` (optional)
  - Returns: List of rewards with details

### Create Reward
- **`POST /rewards/`** - Create a new reward (admin)
  - Role: TENANT_ADMIN
  - Body:
    ```json
    {
      "name": "string",
      "description": "string",
      "cost_points": "integer",
      "image_url": "string" (optional),
      "provider_id": "string" (optional)
    }
    ```

### Redeem Reward
- **`POST /rewards/{reward_id}/redeem`** - Redeem a reward using points
  - Body: `{ "quantity": "integer" }`
  - Returns: `{ "redemption_id": "string", "status": "string" }`

### Verify Redemption
- **`POST /rewards/verify-redeem`** - Validate redemption before processing
  - Body: Redemption data
  - Returns: Validation result

### Get User Rewards
- **`GET /user/rewards`** - Get rewards available to the current user
  - Returns: List of available rewards

### Get User Redemptions
- **`GET /user/redemptions`** - Get user's redemption history
  - Query Params: `skip`, `limit`, `status` (optional)
  - Returns: List of past redemptions

---

## Badges

### List Badges
- **`GET /badges/`** - Get all available badges
  - Returns: List of badge definitions

### Create Badge
- **`POST /badges/`** - Create a new badge (admin)
  - Role: TENANT_ADMIN, PLATFORM_OWNER
  - Body:
    ```json
    {
      "name": "string",
      "description": "string",
      "icon_url": "string",
      "criteria": "string" (optional)
    }
    ```

### Get Badge
- **`GET /badges/{badge_id}`** - Get badge details
  - Returns: Badge information with earned count

### Update Badge
- **`PATCH /badges/{badge_id}`** - Update badge details (admin)
  - Role: TENANT_ADMIN, PLATFORM_OWNER
  - Body: `{ "name": "string", "description": "string", ... }`
  - Returns: Updated badge

### Delete Badge
- **`DELETE /badges/{badge_id}`** - Delete a badge (admin)
  - Role: TENANT_ADMIN, PLATFORM_OWNER
  - Returns: `{ "deleted": true }`

---

## User Management

### Search Users
- **`GET /user/search`** - Search for users by name or email
  - Query Params: `q` (search term, min length 1)
  - Returns: `[{ "id": "string", "name": "string", "email": "string" }]`
  - **Note:** Automatically scoped to current tenant

### Get User Points
- **`GET /user/points`** - Get current user's points balance and history
  - Returns:
    ```json
    {
      "balance": "integer",
      "history": [
        {
          "date": "string",
          "type": "string",
          "amount": "integer",
          "description": "string"
        }
      ]
    }
    ```

### Redeem Points
- **`POST /user/redeem`** - Convert points to rewards (deprecated, use `/rewards/{id}/redeem`)
  - Body: `{ "reward_id": "string", "quantity": "integer" }`

### List Tenant Users
- **`GET /tenant/users`** - Get all users in current tenant (admin)
  - Role: TENANT_ADMIN, TENANT_LEAD
  - Query Params: `skip`, `limit`, `role` (optional)
  - Returns: List of users

### Update User Role
- **`PATCH /tenant/users/{user_id}/role`** - Promote/demote user role (admin)
  - Role: TENANT_ADMIN
  - Body: `{ "new_role": "CORPORATE_USER" | "TENANT_LEAD" | "TENANT_ADMIN" }`
  - Returns: Updated user

---

## Tenant Management

### Get Tenant Dashboard
- **`GET /tenant/dashboard`** - Get comprehensive tenant metrics
  - Role: TENANT_ADMIN, TENANT_LEAD
  - Returns:
    ```json
    {
      "stats": { ... },
      "recognitions_30d": { ... },
      "redemptions_30d": { ... },
      "top_employees": [ ... ],
      "time_series": { ... }
    }
    ```

### Get Budget Status
- **`GET /tenant/budget`** - Get current budget balance
  - Role: TENANT_ADMIN, TENANT_LEAD
  - Returns: `{ "master_balance_paise": "integer", "allocated": "integer", "available": "integer" }`

### Load Master Budget
- **`POST /tenant/budget/load`** - Add funds to master budget (admin)
  - Role: TENANT_ADMIN
  - Body: `{ "amount_paise": "integer", "reference": "string" }`
  - Returns: `{ "new_balance": "integer" }`

### Allocate to Lead
- **`POST /tenant/budget/allocate`** - Transfer budget to a tenant lead (admin)
  - Role: TENANT_ADMIN
  - Body: `{ "lead_user_id": "string", "amount_paise": "integer" }`
  - Returns: `{ "lead_id": "string", "allocated": "integer" }`

### List Budget Logs
- **`GET /tenant/budget/logs`** - View budget transaction history
  - Role: TENANT_ADMIN
  - Query Params: `limit`, `offset`, `transaction_type`, `start_date`, `end_date`
  - Returns: List of budget transactions

### Get Budget Log Detail
- **`GET /tenant/budget/logs/{log_id}`** - Get details of a specific budget transaction
  - Role: TENANT_ADMIN
  - Returns: Budget transaction details

### List Budget Pools
- **`GET /tenant/budgets`** - List all budget pools in tenant
  - Returns: Budget pool information

---

## Tenant Lead Endpoints

### Recognize User (Lead)
- **`POST /lead/recognize`** - Give points to a corporate user (lead only)
  - Role: TENANT_LEAD
  - Body:
    ```json
    {
      "user_id": "string",
      "amount": "integer",
      "note": "string" (optional),
      "category": "string" (optional)
    }
    ```
  - Returns: `{ "recognized": true, "balance": "integer" }`

### Get Lead Budget
- **`GET /lead/budget`** - Get current lead's point budget
  - Role: TENANT_LEAD
  - Returns: `{ "budget_balance": "integer" }`

### Get Lead Team
- **`GET /lead/team`** - Get team members for this lead
  - Role: TENANT_LEAD
  - Returns: List of team members with details

---

## Platform Administration

### Platform Overview
- **`GET /platform/overview`** - Get platform-wide statistics (super admin)
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Returns: Platform metrics and KPIs

### Tenant Statistics
- **`GET /platform/tenant-stats`** - Get statistics across all tenants
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Returns: Aggregated tenant metrics

### Platform Statistics
- **`GET /platform/stats`** - Get detailed platform statistics
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Returns: Platform-wide metrics

### List All Tenants
- **`GET /platform/tenants`** - Get all onboarded tenants
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Query Params: `skip`, `limit`, `status` (optional)
  - Returns: List of tenants

### Onboard Tenant
- **`POST /platform/tenants`** - Create a new tenant
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Body:
    ```json
    {
      "name": "string",
      "subdomain": "string",
      "industry": "string" (optional),
      "employee_count": "integer" (optional)
    }
    ```
  - Returns: Created tenant details

### Tenant Feature Flags
- **`GET /platform/tenants/{tenant_id}/feature_flags`** - Get feature flags
  - Returns: `{ "tenant": "string", "feature_flags": { ... } }`

### Update Feature Flags
- **`PATCH /platform/tenants/{tenant_id}/feature_flags`** - Enable/disable features
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Body: `{ "flags": { "feature_name": "boolean", ... } }`
  - Returns: Updated feature flags

### Suspend Tenant
- **`POST /platform/tenants/{tenant_id}/suspend`** - Suspend a tenant
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Body: `{ "reason": "string" (optional) }`
  - Returns: `{ "tenant": "string", "suspended": true }`

### Unsuspend Tenant
- **`POST /platform/tenants/{tenant_id}/unsuspend`** - Reactivate a tenant
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Returns: `{ "tenant": "string", "suspended": false }`

### Tenant Budget Setup
- **`POST /platform/tenants/{tenant_id}/budgets`** - Configure budget for tenant
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Body: `{ "master_budget_paise": "integer" }`
  - Returns: Updated budget configuration

### List Tenant Leads
- **`GET /platform/admin/tenants/{tenant_id}/leads`** - Get leads in a tenant
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Returns: List of tenant leads

### Create Tenant Admin
- **`POST /platform/create-tenant-admin`** - Create an admin for a tenant
  - Role: PLATFORM_OWNER
  - Body:
    ```json
    {
      "email": "string",
      "name": "string",
      "tenant_id": "string",
      "password": "string" (optional)
    }
    ```
  - Returns: Created admin user

### Load Master Budget
- **`POST /platform/load-budget`** - Add budget to a tenant (platform)
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Body: `{ "tenant_id": "string", "amount_paise": "integer", "reference": "string" }`
  - Returns: Updated balance

### Allocate to Lead
- **`POST /platform/admin/allocate-to-lead`** - Allocate budget to lead (platform)
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Body: `{ "lead_user_id": "string", "amount_paise": "integer" }`
  - Returns: Allocation details

### Budget Logs
- **`GET /platform/logs`** - View platform budget logs
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Query Params: `skip`, `limit`, `tenant_id`, `type`
  - Returns: List of budget transactions

### Budget Log Detail
- **`GET /platform/logs/{log_id}`** - Get details of budget log
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Returns: Transaction details

### Tenant Insights
- **`GET /platform/tenant-insights/{tenant_id}`** - Get detailed analytics for a tenant
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Returns: Comprehensive analytics data

### Rewards Catalog
- **`GET /platform/catalog`** - Get global rewards catalog
  - Returns: List of global reward offerings

### Update Catalog Entry
- **`PATCH /platform/catalog/{provider_id}`** - Update reward provider
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Body: `{ "name": "string", "config": { ... } }`
  - Returns: Updated provider

### Global Rewards
- **`GET /platform/rewards`** - Get global rewards (super admin)
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Returns: List of platform-wide rewards

### Create Global Reward
- **`POST /platform/rewards`** - Create platform reward (super admin)
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Body: Reward configuration
  - Returns: Created reward

### Subscription Plans
- **`GET /platform/subscription-plans`** - Get available subscription tiers
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Returns: List of subscription plans

### Platform Policies
- **`GET /platform/platform/policies`** - Get platform policies
  - Returns: Current policies configuration

### Update Policies
- **`POST /platform/platform/policies`** - Update platform policies
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Body: `{ "policies": { ... } }`
  - Returns: Updated policies

### Recalculate Budgets
- **`POST /platform/recalculate-budgets`** - Recalculate all budgets
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Query Params: `tenant_id` (optional - specific tenant only)
  - Returns: `{ "recalculated": "integer" }`

---

## Analytics

### Analytics Summary
- **`GET /analytics/summary`** - Get high-level analytics summary
  - Returns:
    ```json
    {
      "total_recognitions": "integer",
      "total_users": "integer",
      "participation_rate": "float",
      "total_points": "integer"
    }
    ```

### Recognition Frequency
- **`GET /analytics/recognitions/frequency`** - Recognition trends over time
  - Query Params: `days` (optional, default 30)
  - Returns: Time series of recognition counts

### Manager vs Peer
- **`GET /analytics/recognitions/manager_vs_peer`** - Compare recognition types
  - Returns:
    ```json
    {
      "manager_recognition": "integer",
      "peer_recognition": "integer"
    }
    ```

### Budget Utilization
- **`GET /analytics/budget/utilization`** - Budget spending trends
  - Returns: Budget utilization metrics

### Redemptions Velocity
- **`GET /analytics/redemptions/velocity`** - Redemption rate metrics
  - Returns: Redemption velocity data

---

## Dashboard

### Dashboard Statistics
- **`GET /dashboard/stats`** - Get user dashboard metrics
  - Returns:
    ```json
    {
      "user_stats": { ... },
      "recent_recognitions": [ ... ],
      "available_points": "integer",
      "redeemable_rewards": [ ... ]
    }
    ```

### Admin Dashboard Stats
- **`GET /admin/stats`** - Get admin dashboard metrics
  - Role: PLATFORM_OWNER, SUPER_ADMIN
  - Query Params: `tenant_id` (optional)
  - Returns: Admin-level metrics

---

## Milestones

### Today's Milestones
- **`GET /milestones/today`** - Get milestones due today
  - Returns: List of milestones happening today

### Upcoming Milestones
- **`GET /milestones/upcoming`** - Get upcoming milestones
  - Query Params: `days` (optional, default 7)
  - Returns: Upcoming milestones within timeframe

---

## Authentication & Authorization

### Required Headers

All endpoints require JWT authentication (except `/auth/health`):

```
Authorization: Bearer <jwt_token>
```

Optional header for tenant selection:

```
X-Tenant-ID: <tenant_uuid>
```

### User Roles

- **PLATFORM_OWNER** - Full platform access
- **SUPER_ADMIN** - Platform administration (limited scope)
- **TENANT_ADMIN** - Tenant administration and configuration
- **TENANT_LEAD** - Department/team lead with budget allocation
- **CORPORATE_USER** - Regular user (recognition and redemption)

### Tenant Scoping

Most endpoints are automatically scoped to the current user's tenant. The system validates tenant access and returns only tenant-specific data.

---

## Error Responses

All endpoints follow standard HTTP status codes:

- **200 OK** - Successful request
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid input data
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - User lacks permission
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

Error response format:

```json
{
  "detail": "Error message describing the issue"
}
```

---

## Rate Limiting

The API does not currently enforce strict rate limits but reserves the right to implement them. Plan accordingly for production deployments.

---

## Pagination

Endpoints that return lists typically support pagination with these query parameters:

- `skip` - Number of records to skip (default: 0)
- `limit` - Number of records to return (default: 25, max: 100)

---

## Last Updated

Generated: January 27, 2026

