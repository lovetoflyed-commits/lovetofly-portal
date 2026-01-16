#!/bin/bash

echo "=========================================="
echo "Additional Security Protections Verification"
echo "=========================================="
echo ""

PASS=0
FAIL=0

# Test 1: Registration endpoint has rate limiting
echo "[TEST 1/8] Registration endpoint has rate limiting..."
if grep -q "checkCriticalRateLimit" "src/app/api/auth/register/route.ts" && \
   grep -q "register:" "src/app/api/auth/register/route.ts"; then
  echo "✓ PASS - Registration has critical rate limiting (3/hour)"
  ((PASS++))
else
  echo "✗ FAIL - Registration missing rate limiting"
  ((FAIL++))
fi

# Test 2: Registration endpoint has Sentry
echo "[TEST 2/8] Registration endpoint has Sentry..."
if grep -q "Sentry.captureException" "src/app/api/auth/register/route.ts"; then
  echo "✓ PASS - Registration has Sentry integration"
  ((PASS++))
else
  echo "✗ FAIL - Registration missing Sentry"
  ((FAIL++))
fi

# Test 3: Forgot password endpoint has rate limiting
echo "[TEST 3/8] Forgot password endpoint has rate limiting..."
if grep -q "checkCriticalRateLimit" "src/app/api/auth/forgot-password/route.ts" && \
   grep -q "forgot-password:" "src/app/api/auth/forgot-password/route.ts"; then
  echo "✓ PASS - Forgot password has critical rate limiting (3/hour)"
  ((PASS++))
else
  echo "✗ FAIL - Forgot password missing rate limiting"
  ((FAIL++))
fi

# Test 4: Forgot password endpoint has Sentry
echo "[TEST 4/8] Forgot password endpoint has Sentry..."
if grep -q "Sentry.captureException" "src/app/api/auth/forgot-password/route.ts"; then
  echo "✓ PASS - Forgot password has Sentry integration"
  ((PASS++))
else
  echo "✗ FAIL - Forgot password missing Sentry"
  ((FAIL++))
fi

# Test 5: Reset password endpoint has rate limiting
echo "[TEST 5/8] Reset password endpoint has rate limiting..."
if grep -q "checkStrictRateLimit" "src/app/api/auth/reset-password/route.ts" && \
   grep -q "reset-password:" "src/app/api/auth/reset-password/route.ts"; then
  echo "✓ PASS - Reset password has strict rate limiting (5/min)"
  ((PASS++))
else
  echo "✗ FAIL - Reset password missing rate limiting"
  ((FAIL++))
fi

# Test 6: Reset password endpoint has Sentry
echo "[TEST 6/8] Reset password endpoint has Sentry..."
if grep -q "Sentry.captureException" "src/app/api/auth/reset-password/route.ts"; then
  echo "✓ PASS - Reset password has Sentry integration"
  ((PASS++))
else
  echo "✗ FAIL - Reset password missing Sentry"
  ((FAIL++))
fi

# Test 7: Listing creation endpoint has rate limiting
echo "[TEST 7/8] Listing creation endpoint has rate limiting..."
if grep -q "checkStrictRateLimit" "src/app/api/hangarshare/listing/create/route.ts" && \
   grep -q "listing-create:" "src/app/api/hangarshare/listing/create/route.ts"; then
  echo "✓ PASS - Listing creation has strict rate limiting (5/min)"
  ((PASS++))
else
  echo "✗ FAIL - Listing creation missing rate limiting"
  ((FAIL++))
fi

# Test 8: Listing creation endpoint has Sentry
echo "[TEST 8/8] Listing creation endpoint has Sentry..."
if grep -q "Sentry.captureException" "src/app/api/hangarshare/listing/create/route.ts"; then
  echo "✓ PASS - Listing creation has Sentry integration"
  ((PASS++))
else
  echo "✗ FAIL - Listing creation missing Sentry"
  ((FAIL++))
fi

echo ""
echo "=========================================="
echo "Test Results: $PASS/8 tests passed"
echo "=========================================="

if [ $FAIL -eq 0 ]; then
  echo "✓ ALL TESTS PASSED - Additional Security Verified"
  exit 0
else
  echo "✗ SOME TESTS FAILED - Please review failures above"
  exit 1
fi
