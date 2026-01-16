#!/bin/bash

echo "=========================================="
echo "Security & Monitoring Verification"
echo "=========================================="
echo ""

PASS=0
FAIL=0

# Test 1: Sentry config files exist
echo "[TEST 1/10] Sentry configuration files exist..."
if [ -f "sentry.client.config.ts" ] && [ -f "sentry.server.config.ts" ] && [ -f "sentry.edge.config.ts" ]; then
  echo "✓ PASS - All Sentry config files exist"
  ((PASS++))
else
  echo "✗ FAIL - Missing Sentry config files"
  ((FAIL++))
fi

# Test 2: Rate limiting library exists
echo "[TEST 2/10] Rate limiting library exists..."
if [ -f "src/lib/ratelimit.ts" ]; then
  echo "✓ PASS - Rate limiting library exists"
  ((PASS++))
else
  echo "✗ FAIL - Rate limiting library missing"
  ((FAIL++))
fi

# Test 3: Security middleware exists
echo "[TEST 3/10] Security middleware exists..."
if [ -f "src/middleware.ts" ]; then
  echo "✓ PASS - Security middleware exists"
  ((PASS++))
else
  echo "✗ FAIL - Security middleware missing"
  ((FAIL++))
fi

# Test 4: Rate limiting functions exported
echo "[TEST 4/10] Rate limiting functions defined..."
if grep -q "checkRateLimit" "src/lib/ratelimit.ts" && \
   grep -q "checkStrictRateLimit" "src/lib/ratelimit.ts" && \
   grep -q "checkCriticalRateLimit" "src/lib/ratelimit.ts"; then
  echo "✓ PASS - All rate limiting functions defined"
  ((PASS++))
else
  echo "✗ FAIL - Missing rate limiting functions"
  ((FAIL++))
fi

# Test 5: Security headers configured
echo "[TEST 5/10] Security headers configured..."
if grep -q "X-Frame-Options" "src/middleware.ts" && \
   grep -q "Content-Security-Policy" "src/middleware.ts" && \
   grep -q "X-Content-Type-Options" "src/middleware.ts"; then
  echo "✓ PASS - Security headers configured"
  ((PASS++))
else
  echo "✗ FAIL - Security headers not properly configured"
  ((FAIL++))
fi

# Test 6: Login endpoint has rate limiting
echo "[TEST 6/10] Login endpoint has rate limiting..."
if grep -q "checkStrictRateLimit" "src/app/api/auth/login/route.ts"; then
  echo "✓ PASS - Login endpoint has rate limiting"
  ((PASS++))
else
  echo "✗ FAIL - Login endpoint missing rate limiting"
  ((FAIL++))
fi

# Test 7: Login endpoint has Sentry
echo "[TEST 7/10] Login endpoint has Sentry integration..."
if grep -q "Sentry.captureException" "src/app/api/auth/login/route.ts"; then
  echo "✓ PASS - Login endpoint has Sentry integration"
  ((PASS++))
else
  echo "✗ FAIL - Login endpoint missing Sentry integration"
  ((FAIL++))
fi

# Test 8: Payment endpoint has rate limiting
echo "[TEST 8/10] Payment endpoint has rate limiting..."
if grep -q "checkStrictRateLimit" "src/app/api/hangarshare/owner/payment-intent/route.ts"; then
  echo "✓ PASS - Payment endpoint has rate limiting"
  ((PASS++))
else
  echo "✗ FAIL - Payment endpoint missing rate limiting"
  ((FAIL++))
fi

# Test 9: Payment endpoint has Sentry
echo "[TEST 9/10] Payment endpoint has Sentry integration..."
if grep -q "Sentry.captureException" "src/app/api/hangarshare/owner/payment-intent/route.ts"; then
  echo "✓ PASS - Payment endpoint has Sentry integration"
  ((PASS++))
else
  echo "✗ FAIL - Payment endpoint missing Sentry integration"
  ((FAIL++))
fi

# Test 10: NPM packages installed
echo "[TEST 10/10] Required NPM packages installed..."
if grep -q "@sentry/nextjs" "package.json" && \
   grep -q "@upstash/ratelimit" "package.json" && \
   grep -q "@upstash/redis" "package.json"; then
  echo "✓ PASS - All required packages in package.json"
  ((PASS++))
else
  echo "✗ FAIL - Missing required packages"
  ((FAIL++))
fi

echo ""
echo "=========================================="
echo "Test Results: $PASS/10 tests passed"
echo "=========================================="

if [ $FAIL -eq 0 ]; then
  echo "✓ ALL TESTS PASSED - Security & Monitoring Verified"
  exit 0
else
  echo "✗ SOME TESTS FAILED - Please review failures above"
  exit 1
fi
