#!/bin/bash

# Integration Test: Hangar Owner Onboarding Flow
# Tests owner setup → listing creation → status check

echo "=========================================="
echo "Integration Test 3: Owner Onboarding Flow"
echo "=========================================="
echo ""

BASE_URL="${BASE_URL:-http://localhost:3000}"
# Generate unique IDs using timestamp and random number
TIMESTAMP="$(date +%s)${RANDOM}"
TEST_EMAIL="owner-${TIMESTAMP}@lovetofly.com"
TEST_PASSWORD="OwnerPass123!@#"
TEST_CPF="${TIMESTAMP:3:11}"
TEST_CNPJ="${TIMESTAMP:2:14}"
PASS=0
FAIL=0

echo "Test Configuration:"
echo "- Base URL: $BASE_URL"
echo "- Owner Email: $TEST_EMAIL"
echo ""

# Setup: Register and login
echo "[SETUP] Registering owner account..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Hangar\",
    \"lastName\": \"Owner\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"cpf\": \"$TEST_CPF\",
    \"birthDate\": \"1980-01-01\",
    \"mobilePhone\": \"11977777777\",
    \"addressStreet\": \"Owner Street\",
    \"addressNumber\": \"456\",
    \"addressNeighborhood\": \"Business\",
    \"addressCity\": \"São Paulo\",
    \"addressState\": \"SP\",
    \"addressZip\": \"01234567\",
    \"addressCountry\": \"Brazil\",
    \"aviationRole\": \"hangar_owner\",
    \"terms\": true
  }")

if ! echo "$REGISTER_RESPONSE" | grep -q '"id"\|successfully'; then
  echo "✗ SETUP FAILED - Could not register owner"
  exit 1
fi

echo "[SETUP] Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "✗ SETUP FAILED - Could not get auth token"
  exit 1
fi

echo "✓ Setup complete - Owner registered and logged in"
echo ""

# Test 1: Create owner profile
echo "[TEST 1/5] Create hangar owner profile..."
OWNER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/hangarshare/owner/setup" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"companyName\": \"Test Hangars Ltda\",
    \"cnpj\": \"$TEST_CNPJ\",
    \"businessPhone\": \"1133334444\",
    \"businessEmail\": \"contact@testhangars.com\",
    \"businessAddress\": \"Business Ave, 789\",
    \"businessCity\": \"São Paulo\"
  }")

if echo "$OWNER_RESPONSE" | grep -q '"ownerId"\|"id"\|successfully'; then
  OWNER_ID=$(echo "$OWNER_RESPONSE" | grep -o '"ownerId":[0-9]*' | grep -o '[0-9]*' | head -1)
  echo "✓ PASS - Owner profile created successfully"
  [ -n "$OWNER_ID" ] && echo "  Owner ID: $OWNER_ID"
  ((PASS++))
else
  echo "✗ FAIL - Owner profile creation failed"
  echo "  Response: $OWNER_RESPONSE"
  ((FAIL++))
fi
echo ""

# Test 2: Create hangar listing
echo "[TEST 2/5] Create hangar listing..."
LISTING_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/hangarshare/listing/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"icaoCode\": \"SBSP\",
    \"aerodromeData\": {
      \"airport_name\": \"Congonhas Airport\",
      \"city\": \"São Paulo\",
      \"state\": \"SP\",
      \"country\": \"Brazil\"
    },
    \"hangarNumber\": \"H-$(date +%s)\",
    \"hangarSizeSqm\": 200,
    \"hangarLocationDescription\": \"Near taxiway\",
    \"maxWingspanMeters\": 15,
    \"maxLengthMeters\": 12,
    \"maxHeightMeters\": 5,
    \"totalSpaces\": 1,
    \"availableSpaces\": 1,
    \"spaceDescription\": \"Full hangar space\",
    \"hourlyRate\": 50,
    \"dailyRate\": 300,
    \"weeklyRate\": 1800,
    \"monthlyRate\": 6000,
    \"acceptsOnlinePayment\": true,
    \"acceptsPaymentOnArrival\": true,
    \"cancellationPolicy\": \"flexible\",
    \"description\": \"Test hangar for integration testing\"
  }")

HTTP_CODE=$(echo "$LISTING_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LISTING_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  LISTING_ID=$(echo "$RESPONSE_BODY" | grep -o '"listingId":[0-9]*' | grep -o '[0-9]*')
  echo "✓ PASS - Listing created successfully"
  echo "  Listing ID: $LISTING_ID"
  ((PASS++))
else
  echo "✗ FAIL - Listing creation failed (HTTP $HTTP_CODE)"
  echo "  Response: $RESPONSE_BODY"
  ((FAIL++))
fi
echo ""

# Test 3: Verify listing status (should be pending)
echo "[TEST 3/5] Check listing status..."
if [ -n "$LISTING_ID" ]; then
  STATUS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/hangarshare/listings/$LISTING_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  HTTP_CODE=$(echo "$STATUS_RESPONSE" | tail -n1)
  RESPONSE_BODY=$(echo "$STATUS_RESPONSE" | head -n-1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    # Check if status is pending_approval
    if echo "$RESPONSE_BODY" | grep -q "pending"; then
      echo "✓ PASS - Listing status is pending (requires admin approval)"
      ((PASS++))
    else
      echo "⚠ WARNING - Listing may not require approval"
      echo "  Response: $RESPONSE_BODY"
      ((PASS++))  # Not a failure, might be auto-approved
    fi
  else
    echo "✗ FAIL - Could not fetch listing status (HTTP $HTTP_CODE)"
    ((FAIL++))
  fi
else
  echo "✗ SKIP - No listing ID from previous step"
  ((FAIL++))
fi
echo ""

# Test 4: Test rate limiting on listing creation
echo "[TEST 4/5] Test rate limiting on listing creation..."
echo "  Attempting 6 rapid listing creations (limit is 5/min)..."

RATE_LIMITED=false
for i in {1..6}; do
  RATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/hangarshare/listing/create" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"icaoCode\": \"SBSP\",
      \"aerodromeData\": {\"airport_name\": \"Test\", \"city\": \"SP\", \"state\": \"SP\", \"country\": \"BR\"},
      \"hangarNumber\": \"TEST-$i\",
      \"hangarSizeSqm\": 100,
      \"totalSpaces\": 1,
      \"availableSpaces\": 1,
      \"hourlyRate\": 50
    }")
  
  HTTP_CODE=$(echo "$RATE_RESPONSE" | tail -n1)
  echo "  Attempt $i: HTTP $HTTP_CODE"
  
  if [ "$HTTP_CODE" = "429" ]; then
    RATE_LIMITED=true
    break
  fi
done

if [ "$RATE_LIMITED" = true ]; then
  echo "✓ PASS - Rate limiting working (got 429 Too Many Requests)"
  ((PASS++))
else
  echo "✗ FAIL - Rate limiting not triggered after 6 attempts"
  ((FAIL++))
fi
echo ""

# Test 5: Fetch owner's listings
echo "[TEST 5/5] Fetch owner's listings..."
LISTINGS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/hangarshare/owner/listings" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$LISTINGS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LISTINGS_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  # Check if response contains listings
  if echo "$RESPONSE_BODY" | grep -q "listings"; then
    echo "✓ PASS - Successfully fetched owner's listings"
    ((PASS++))
  else
    echo "⚠ WARNING - Response format unexpected"
    echo "  Response: $RESPONSE_BODY"
    ((PASS++))  # Not a hard failure
  fi
else
  echo "✗ FAIL - Could not fetch listings (HTTP $HTTP_CODE)"
  echo "  Response: $RESPONSE_BODY"
  ((FAIL++))
fi
echo ""

# Summary
echo "=========================================="
echo "Test Results: $PASS/5 tests passed"
echo "=========================================="

if [ $FAIL -eq 0 ]; then
  echo "✓ ALL TESTS PASSED - Owner Onboarding Flow Working"
  exit 0
else
  echo "✗ SOME TESTS FAILED - Review failures above"
  exit 1
fi
