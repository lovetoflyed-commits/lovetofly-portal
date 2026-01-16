#!/bin/bash

# Test script for Task 5.1 - Booking Status Management API
# Tests the booking status update endpoint

echo "=========================================="
echo "Task 5.1 Verification - Booking Status API"
echo "=========================================="
echo ""

PASS=0
FAIL=0

# Test 1: Check if endpoint file exists
echo "[TEST 1/5] Checking if endpoint file exists..."
if [ -f "src/app/api/hangarshare/owner/bookings/[bookingId]/route.ts" ]; then
  echo "✓ PASS - File exists"
  ((PASS++))
else
  echo "✗ FAIL - File does not exist"
  ((FAIL++))
fi

# Test 2: Check for PATCH export
echo "[TEST 2/5] Checking for PATCH endpoint export..."
if grep -q "export async function PATCH" "src/app/api/hangarshare/owner/bookings/[bookingId]/route.ts"; then
  echo "✓ PASS - PATCH endpoint exported"
  ((PASS++))
else
  echo "✗ FAIL - PATCH endpoint not found"
  ((FAIL++))
fi

# Test 3: Check for GET export
echo "[TEST 3/5] Checking for GET endpoint export..."
if grep -q "export async function GET" "src/app/api/hangarshare/owner/bookings/[bookingId]/route.ts"; then
  echo "✓ PASS - GET endpoint exported"
  ((PASS++))
else
  echo "✗ FAIL - GET endpoint not found"
  ((FAIL++))
fi

# Test 4: Check for status validation logic
echo "[TEST 4/5] Checking for status transition validation..."
if grep -q "VALID_TRANSITIONS" "src/app/api/hangarshare/owner/bookings/[bookingId]/route.ts"; then
  echo "✓ PASS - Status validation logic present"
  ((PASS++))
else
  echo "✗ FAIL - Status validation not found"
  ((FAIL++))
fi

# Test 5: Check for authorization check
echo "[TEST 5/5] Checking for owner authorization..."
if grep -q "isOwner" "src/app/api/hangarshare/owner/bookings/[bookingId]/route.ts"; then
  echo "✓ PASS - Authorization check present"
  ((PASS++))
else
  echo "✗ FAIL - Authorization check not found"
  ((FAIL++))
fi

echo ""
echo "=========================================="
echo "Test Results: $PASS/$((PASS + FAIL)) tests passed"
echo "=========================================="

if [ $FAIL -eq 0 ]; then
  echo "✓ ALL TESTS PASSED - Task 5.1 Implementation Verified"
  exit 0
else
  echo "✗ SOME TESTS FAILED - Please review implementation"
  exit 1
fi
