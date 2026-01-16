#!/bin/bash

# Integration Test: User Registration and Login Flow
# Tests the complete auth journey from registration to authenticated access

echo "=========================================="
echo "Integration Test 1: User Auth Flow"
echo "=========================================="
echo ""

BASE_URL="${BASE_URL:-http://localhost:3000}"
# Generate unique CPF based on timestamp and random number
TIMESTAMP="$(date +%s)${RANDOM}"
TEST_EMAIL="test-${TIMESTAMP}@lovetofly.com"
TEST_PASSWORD="TestPass123!@#"
TEST_CPF="${TIMESTAMP:3:11}"  # Use portion of timestamp
PASS=0
FAIL=0

echo "Test Configuration:"
echo "- Base URL: $BASE_URL"
echo "- Test Email: $TEST_EMAIL"
echo ""

# Test 1: Register new user
echo "[TEST 1/5] User registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"cpf\": \"$TEST_CPF\",
    \"birthDate\": \"1990-01-01\",
    \"mobilePhone\": \"11999999999\",
    \"addressStreet\": \"Test Street\",
    \"addressNumber\": \"123\",
    \"addressNeighborhood\": \"Test Neighborhood\",
    \"addressCity\": \"São Paulo\",
    \"addressState\": \"SP\",
    \"addressZip\": \"01234567\",
    \"addressCountry\": \"Brazil\",
    \"aviationRole\": \"pilot\",
    \"terms\": true
  }")

# Check if registration was successful by looking for success indicators
if echo "$REGISTER_RESPONSE" | grep -q '"id":\|"user":\|successfully'; then
  echo "✓ PASS - User registered successfully"
  echo "  Response preview: $(echo "$REGISTER_RESPONSE" | head -c 100)..."
  ((PASS++))
else
  echo "✗ FAIL - Registration failed"
  echo "  Response: $REGISTER_RESPONSE"
  ((FAIL++))
  echo "  Cannot continue without successful registration"
  exit 1
fi
echo ""

# Test 2: Login with new credentials
echo "[TEST 2/5] User login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
  # Extract token from response using grep and sed
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  
  if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "✓ PASS - Login successful, token received"
    echo "  Token preview: ${TOKEN:0:20}..."
    ((PASS++))
  else
    echo "✗ FAIL - Login successful but token extraction failed"
    echo "  Response: $LOGIN_RESPONSE"
    ((FAIL++))
    exit 1
  fi
else
  echo "✗ FAIL - Login failed or no token in response"
  echo "  Response: $LOGIN_RESPONSE"
  ((FAIL++))
  exit 1
fi
echo ""

# Test 3: Access protected resource with token
echo "[TEST 3/5] Access user profile with token..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/user/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$PROFILE_RESPONSE" | grep -q '"id"\|"email"\|"name"'; then
  echo "✓ PASS - Protected resource accessed successfully"
  ((PASS++))
else
  echo "✗ FAIL - Could not access protected resource"
  echo "  Response: $PROFILE_RESPONSE"
  ((FAIL++))
fi
echo ""

# Test 4: Access protected resource without token (should fail)
echo "[TEST 4/5] Access protected resource without token..."
NO_AUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/api/user/profile" \
  -H "Content-Type: application/json")

if echo "$NO_AUTH_RESPONSE" | grep -q '"error"\|"message"\|Unauthorized'; then
  echo "✓ PASS - Correctly rejected request without token"
  ((PASS++))
else
  echo "✗ FAIL - Should reject unauthorized request"
  echo "  Response: $NO_AUTH_RESPONSE"
  ((FAIL++))
fi
echo ""

# Test 4: Access protected resource without token (should fail)
echo "[TEST 4/5] Access protected resource without token..."
NO_AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/user/profile")

HTTP_CODE=$(echo "$NO_AUTH_RESPONSE" | tail -n1)

# Test 4: Access protected resource without token (should fail)
echo "[TEST 4/5] Access protected resource without token..."
NO_AUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/api/user/profile" \
  -H "Content-Type: application/json")

if echo "$NO_AUTH_RESPONSE" | grep -q '"error"\|"message"\|Unauthorized'; then
  echo "✓ PASS - Correctly rejected request without token"
  ((PASS++))
else
  echo "✗ FAIL - Should reject unauthorized request"
  echo "  Response: $NO_AUTH_RESPONSE"
  ((FAIL++))
fi
echo ""

# Test 5: Attempt login with wrong password
echo "[TEST 5/5] Login with incorrect password..."
WRONG_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"WrongPassword123\"
  }")

if echo "$WRONG_LOGIN_RESPONSE" | grep -q '"error"\|"message"\|Invalid'; then
  echo "✓ PASS - Correctly rejected invalid credentials"
  ((PASS++))
else
  echo "✗ FAIL - Should reject invalid credentials"
  echo "  Response: $WRONG_LOGIN_RESPONSE"
  ((FAIL++))
fi
echo ""

# Summary
echo "=========================================="
echo "Test Results: $PASS/5 tests passed"
echo "=========================================="

if [ $FAIL -eq 0 ]; then
  echo "✓ ALL TESTS PASSED - User Auth Flow Working"
  exit 0
else
  echo "✗ SOME TESTS FAILED - Review failures above"
  exit 1
fi
