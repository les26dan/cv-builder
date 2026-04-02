#!/bin/bash
# Requires BOOTSTRAP_ADMIN_* in environment (e.g. source .env.local in your shell or export manually).

set -euo pipefail

: "${BOOTSTRAP_ADMIN_EMAIL:?Set BOOTSTRAP_ADMIN_EMAIL}"
: "${BOOTSTRAP_ADMIN_PASSWORD:?Set BOOTSTRAP_ADMIN_PASSWORD}"

ALIAS="${BOOTSTRAP_ADMIN_LOGIN_ALIAS:-adminbuddy}"

echo "🧪 Testing bootstrap admin login"
echo "================================"

echo "🔑 Test 1: Login with alias '${ALIAS}'"
response1=$(curl -s -X POST http://localhost:3000/api/login/ \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ALIAS}\",\"password\":\"${BOOTSTRAP_ADMIN_PASSWORD}\"}")

echo "Response: $response1"
if echo "$response1" | grep -q '"success":true'; then
  echo "✅ SUCCESS: Alias login"
else
  echo "❌ FAILED: Alias login"
fi

echo ""
echo "📧 Test 2: Login with BOOTSTRAP_ADMIN_EMAIL"
response2=$(curl -s -X POST http://localhost:3000/api/login/ \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${BOOTSTRAP_ADMIN_EMAIL}\",\"password\":\"${BOOTSTRAP_ADMIN_PASSWORD}\"}")

echo "Response: $response2"
if echo "$response2" | grep -q '"success":true'; then
  echo "✅ SUCCESS: Email login"
else
  echo "❌ FAILED: Email login"
fi

echo ""
echo "Admin dashboard: http://localhost:3000/admin/"
echo "Docs: ADMIN_ACCESS.md"
