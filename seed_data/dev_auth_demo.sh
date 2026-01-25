#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE_URL:-http://localhost:18000}"

if ! command -v jq >/dev/null 2>&1; then
  echo "This script requires 'jq' (https://stedolan.github.io/jq/). Install it and rerun."
  exit 1
fi

echo "Base URL: $BASE"

echo "\n=== 1) /auth/dev-token?role=PLATFORM_OWNER ==="
resp=$(curl -s "${BASE}/auth/dev-token?role=PLATFORM_OWNER")
if [ -z "$resp" ]; then
  echo "No response from dev-token. Is the backend running at $BASE?"
  exit 1
fi

token=$(echo "$resp" | jq -r .token)
echo "Token (first 64 chars): ${token:0:64}..."
echo "User:"
echo "$resp" | jq .user

echo "\nCalling GET /platform/tenants with the token (may require PLATFORM_OWNER role)..."
curl -s -H "Authorization: Bearer $token" "${BASE}/platform/tenants" | jq .


echo "\n=== 2) /auth/dev-login (super@lighthouse.com) ==="
resp2=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email":"super@lighthouse.com"}' "${BASE}/auth/dev-login")
if [ -z "$resp2" ]; then
  echo "No response from dev-login. Is the backend running at $BASE?"
  exit 1
fi

token2=$(echo "$resp2" | jq -r .token)
echo "Token2 (first 64 chars): ${token2:0:64}..."
echo "User2:"
echo "$resp2" | jq .user

echo "\nCalling GET /platform/overview with token2 (PLATFORM_OWNER expected)..."
curl -s -H "Authorization: Bearer $token2" "${BASE}/platform/overview" | jq .


echo "\nDone.\n"
