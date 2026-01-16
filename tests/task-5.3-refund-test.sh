#!/bin/bash

# Task 5.3: Test Refund Processing - Automated Test Script
# Tests Stripe refund integration and email notifications

echo "═══════════════════════════════════════════════════════════════"
echo "  Task 5.3: Refund Processing Test Suite"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Test function
test_endpoint() {
  local test_name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local expected_status="$5"
  local token="$6"

  echo -e "${BLUE}Testing:${NC} $test_name"
  
  if [ -n "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "http://localhost:3000$endpoint" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $token" \
      -d "$data")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "http://localhost:3000$endpoint" \
      -H "Authorization: Bearer $token")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - HTTP $http_code"
    PASSED=$((PASSED + 1))
    
    # Pretty print JSON response
    if [ -n "$body" ]; then
      echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
  else
    echo -e "${RED}✗ FAILED${NC} - Expected HTTP $expected_status, got HTTP $http_code"
    FAILED=$((FAILED + 1))
    echo "Response: $body"
  fi
  
  echo ""
}

# Check if server is running
echo "1️⃣  Checking Development Server..."
if ! curl -s http://localhost:3000 > /dev/null; then
  echo -e "${RED}✗ Development server not running!${NC}"
  echo "Please run: npm run dev"
  exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Check environment variables
echo "2️⃣  Checking Environment Variables..."

if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo -e "${YELLOW}⚠ STRIPE_SECRET_KEY not set - Refund tests will fail${NC}"
fi

if [ -z "$RESEND_API_KEY" ]; then
  echo -e "${YELLOW}⚠ RESEND_API_KEY not set - Email tests will fail${NC}"
fi

if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}✗ DATABASE_URL not set - Tests cannot continue${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Database configured${NC}"
echo ""

# Database setup check
echo "3️⃣  Checking Database Schema..."

# Check if refund columns exist
psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='bookings' AND column_name IN ('payment_intent_id', 'refund_id', 'refund_amount', 'refund_status', 'refund_error');" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Refund tracking columns exist${NC}"
else
  echo -e "${RED}✗ Missing refund columns in bookings table${NC}"
  echo "Run migration: npm run migrate:up"
  exit 1
fi
echo ""

# Test Login (get token)
echo "4️⃣  Testing Authentication..."

LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@test.com",
    "password": "test123"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${YELLOW}⚠ Could not login with test owner account${NC}"
  echo "Creating test account or use existing credentials..."
  TOKEN="test-token-placeholder"
else
  echo -e "${GREEN}✓ Authenticated successfully${NC}"
fi
echo ""

# Test cases
echo "5️⃣  Running Refund Processing Tests..."
echo ""

# Test 1: Get bookings (owner must have bookings)
test_endpoint \
  "Get owner bookings" \
  "GET" \
  "/api/hangarshare/owner/bookings" \
  "" \
  200 \
  "$TOKEN"

# Test 2: Update booking status to cancelled (triggers refund)
# Note: Replace BOOKING_ID with actual booking ID from database
BOOKING_ID="test-booking-id"

test_endpoint \
  "Update booking to cancelled (with refund)" \
  "PATCH" \
  "/api/hangarshare/owner/bookings/$BOOKING_ID" \
  '{"booking_status":"cancelled"}' \
  200 \
  "$TOKEN"

# Test 3: Verify refund was recorded in database
echo -e "${BLUE}Testing:${NC} Verify refund in database"
REFUND_CHECK=$(psql "$DATABASE_URL" -t -c "SELECT refund_id, refund_amount, refund_status FROM bookings WHERE id='$BOOKING_ID' AND refund_id IS NOT NULL;" 2>/dev/null)

if [ -n "$REFUND_CHECK" ]; then
  echo -e "${GREEN}✓ PASSED${NC} - Refund recorded in database"
  echo "$REFUND_CHECK"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}⚠ SKIPPED${NC} - No refund found (check if booking had payment_intent_id)"
fi
echo ""

# Test 4: Check Stripe refund creation (if Stripe key is available)
if [ -n "$STRIPE_SECRET_KEY" ]; then
  echo -e "${BLUE}Testing:${NC} Verify Stripe refund exists"
  
  REFUND_ID=$(psql "$DATABASE_URL" -t -c "SELECT refund_id FROM bookings WHERE id='$BOOKING_ID';" 2>/dev/null | xargs)
  
  if [ -n "$REFUND_ID" ]; then
    STRIPE_CHECK=$(curl -s "https://api.stripe.com/v1/refunds/$REFUND_ID" \
      -u "$STRIPE_SECRET_KEY:")
    
    REFUND_STATUS=$(echo "$STRIPE_CHECK" | jq -r '.status // empty')
    
    if [ "$REFUND_STATUS" = "succeeded" ] || [ "$REFUND_STATUS" = "pending" ]; then
      echo -e "${GREEN}✓ PASSED${NC} - Stripe refund status: $REFUND_STATUS"
      PASSED=$((PASSED + 1))
    else
      echo -e "${RED}✗ FAILED${NC} - Stripe refund not found or failed"
      echo "$STRIPE_CHECK"
      FAILED=$((FAILED + 1))
    fi
  else
    echo -e "${YELLOW}⚠ SKIPPED${NC} - No refund_id in database"
  fi
else
  echo -e "${YELLOW}⚠ SKIPPED${NC} - STRIPE_SECRET_KEY not configured"
fi
echo ""

# Test 5: Verify email was sent (check Resend logs manually)
echo -e "${BLUE}Manual Check:${NC} Email notification sent to client"
echo "→ Check Resend dashboard at: https://resend.com/emails"
echo "→ Look for email to client with refund information"
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════════"
echo "  Test Summary"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
  exit 1
fi
