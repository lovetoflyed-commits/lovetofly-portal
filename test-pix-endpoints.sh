#!/bin/bash

# ============================================
# PIX Integration - Complete Test Suite
# ============================================
# Run all PIX endpoint tests

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
TOKEN="${TOKEN:-}"

echo "🧪 PIX Integration Test Suite"
echo "============================="
echo "Base URL: $BASE_URL"
echo ""

if [ -z "$TOKEN" ]; then
  echo "⚠️  WARNING: TOKEN not set. Some tests will fail."
  echo "Set with: export TOKEN='your-jwt-token'"
  echo ""
fi

# Test counter
passed=0
failed=0

# Test function
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  
  echo -n "Testing: $name ... "
  
  if [ -z "$TOKEN" ]; then
    headers="-H 'Content-Type: application/json'"
  else
    headers="-H 'Content-Type: application/json' -H 'Authorization: Bearer $TOKEN'"
  fi
  
  if [ "$method" = "POST" ]; then
    response=$(curl -s -X POST "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$data")
  else
    response=$(curl -s -X GET "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN")
  fi
  
  if echo "$response" | grep -q "error\|\"success\":false" 2>/dev/null; then
    echo "❌ FAILED"
    echo "  Response: $response"
    ((failed++))
  else
    echo "✅ PASSED"
    ((passed++))
  fi
}

# ============ Test 1: Create Payment ============
echo "1️⃣  Payment Creation"
echo "-------------------"

test_endpoint \
  "Create membership payment" \
  "POST" \
  "/api/payments/pix/create" \
  '{
    "orderType": "membership",
    "orderId": "membership-pro",
    "amountCents": 50000,
    "description": "Pro membership"
  }'

test_endpoint \
  "Create booking payment" \
  "POST" \
  "/api/payments/pix/create" \
  '{
    "orderType": "hangar_booking",
    "orderId": "booking-123",
    "amountCents": 150000,
    "description": "Hangar booking"
  }'

echo ""

# ============ Test 2: Payment Status ============
echo "2️⃣  Payment Status"
echo "-----------------"

test_endpoint \
  "Get membership payment status" \
  "GET" \
  "/api/payments/pix/status/membership-pro"

test_endpoint \
  "Get booking payment status" \
  "GET" \
  "/api/payments/pix/status/booking-123"

echo ""

# ============ Test 3: Admin Reconciliation ============
echo "3️⃣  Admin Tools"
echo "---------------"

test_endpoint \
  "Admin reconciliation" \
  "POST" \
  "/api/admin/pix-reconcile" \
  '{
    "confirmPendingBookings": true
  }'

echo ""

# ============ Test 4: Webhook (Requires Secret) ============
echo "4️⃣  Webhook (Manual Test)"
echo "------------------------"

echo "Webhook testing requires asaas-access-token header"
echo "See PIX_SETUP_GUIDE.md for testing instructions"

echo ""

# ============ Summary ============
echo "============================="
echo "Summary: $passed passed, $failed failed"

if [ $failed -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ Some tests failed"
  exit 1
fi
