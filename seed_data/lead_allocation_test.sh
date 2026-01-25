#!/usr/bin/env bash
set -euo pipefail

# Lead allocation smoke test
# Usage:
#   ./scripts/lead_allocation_test.sh [TENANT_ID] [USER_ID_TO_PROMOTE] [LEAD_ID]
# Environment:
#   BASE - backend base URL (default http://localhost:18000)
# Notes:
#   - Requires `jq` installed.
#   - This script uses dev helpers; it will create dev users when needed.

BASE="${BASE_URL:-http://localhost:18000}"
TENANT_ID_ARG="${1:-}"     # optional: pass tenant id to skip auto-detect
USER_ID_PROMOTE_ARG="${2:-}" # optional: user id to promote to TENANT_LEAD
LEAD_ID_ARG="${3:-}"        # optional: target lead id to allocate to

if ! command -v jq >/dev/null 2>&1; then
  echo "This script requires 'jq'. Install it and rerun."
  exit 1
fi

echo "Using BASE=$BASE"

echo "1) Get PLATFORM_OWNER dev token"
PLATFORM_RESP=$(curl -s "$BASE/auth/dev-token?role=PLATFORM_OWNER")
echo "$PLATFORM_RESP" | jq .
PLATFORM_TOKEN=$(echo "$PLATFORM_RESP" | jq -r .token)

if [ -z "$PLATFORM_TOKEN" ] || [ "$PLATFORM_TOKEN" = "null" ]; then
  echo "Failed to get PLATFORM_OWNER token" >&2
  exit 2
fi

# 2) List tenants and find Triton (or use provided TENANT_ID_ARG)
if [ -n "$TENANT_ID_ARG" ]; then
  TRITON_ID="$TENANT_ID_ARG"
else
  TENANTS=$(curl -s -H "Authorization: Bearer $PLATFORM_TOKEN" "$BASE/platform/tenants")
  echo "$TENANTS" | jq .
  TRITON_ID=$(echo "$TENANTS" | jq -r '.[] | select(.subdomain|ascii_downcase == "triton") | .id' | head -n1)
  if [ -z "$TRITON_ID" ] || [ "$TRITON_ID" = "null" ]; then
    echo "Triton tenant not found. Pass tenant id as first argument to the script." >&2
    exit 3
  fi
fi

echo "Triton tenant id: $TRITON_ID"

# 3) Create dev Tenant Admin for Triton
DEV_TENANT_ADMIN_RESP=$(curl -s "$BASE/auth/dev-token?role=TENANT_ADMIN&tenant_id=$TRITON_ID")
echo "$DEV_TENANT_ADMIN_RESP" | jq .
TENANT_ADMIN_TOKEN=$(echo "$DEV_TENANT_ADMIN_RESP" | jq -r .token)

if [ -z "$TENANT_ADMIN_TOKEN" ] || [ "$TENANT_ADMIN_TOKEN" = "null" ]; then
  echo "Failed to get tenant admin token" >&2
  exit 4
fi

# 4) Load master budget (as Tenant Admin) - +₹1,000,000
echo "Loading master budget: ₹1,000,000"
LOAD_RESP=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" -d '{"amount":1000000}' "$BASE/tenant/budget/load")
echo "$LOAD_RESP" | jq .

# 5) Promote a user to TENANT_LEAD if USER_ID_PROMOTE_ARG provided
if [ -n "$USER_ID_PROMOTE_ARG" ]; then
  echo "Promoting user $USER_ID_PROMOTE_ARG to TENANT_LEAD"
  PROM_RESP=$(curl -s -X PATCH -H "Content-Type: application/json" -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" -d '{"role":"TENANT_LEAD"}' "$BASE/tenant/users/$USER_ID_PROMOTE_ARG/role")
  echo "$PROM_RESP" | jq .
fi

# 6) Determine lead id: prefer argument, otherwise pick first lead (or promote first corporate user)
LEAD_ID=""
if [ -n "$LEAD_ID_ARG" ]; then
  LEAD_ID="$LEAD_ID_ARG"
else
  # try listing platform-admin leads first
  LEADS_PLAT=$(curl -s -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" "$BASE/platform/admin/tenants/$TRITON_ID/leads")
  LEAD_ID=$(echo "$LEADS_PLAT" | jq -r '.[0].id')
  if [ -z "$LEAD_ID" ] || [ "$LEAD_ID" = "null" ]; then
    # find a corporate user and promote
    USERS=$(curl -s -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" "$BASE/tenant/users")
    CANDIDATE_ID=$(echo "$USERS" | jq -r '.[] | select(.role=="CORPORATE_USER") | .id' | head -n1)
    if [ -n "$CANDIDATE_ID" ]; then
      echo "Promoting candidate $CANDIDATE_ID to TENANT_LEAD"
      curl -s -X PATCH -H "Content-Type: application/json" -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" -d '{"role":"TENANT_LEAD"}' "$BASE/tenant/users/$CANDIDATE_ID/role" | jq .
      LEAD_ID="$CANDIDATE_ID"
    fi
  fi
fi

if [ -z "$LEAD_ID" ] || [ "$LEAD_ID" = "null" ]; then
  echo "No lead available to allocate to. Provide LEAD_ID as third arg or ensure a TENANT_LEAD exists." >&2
  exit 5
fi

echo "Selected LEAD_ID: $LEAD_ID"

# 7) Allocate ₹200,000 to the lead
echo "Allocating ₹200,000 to lead $LEAD_ID"
ALLOC_RESP=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" -d "{\"tenant_id\":\"$TRITON_ID\",\"lead_id\":\"$LEAD_ID\",\"amount\":200000}" "$BASE/platform/admin/allocate-to-lead")
echo "$ALLOC_RESP" | jq .

# 8) Verify balances
echo "Verifying tenant budget and lead balances"
VERIFY=$(curl -s -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" "$BASE/tenant/budget")
echo "$VERIFY" | jq .

echo "Done."
