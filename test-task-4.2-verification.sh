#!/bin/bash

# Test script for Task 4.2 - Admin Document Review Dashboard
# Tests the document review system implementation

echo "=========================================="
echo "Task 4.2 Verification - Admin Document Review"
echo "=========================================="
echo ""

PASS=0
FAIL=0

# Test 1: Check if admin documents page exists
echo "[TEST 1/8] Checking if admin documents page exists..."
if [ -f "src/app/admin/documents/page.tsx" ]; then
  echo "✓ PASS - Admin documents page exists"
  ((PASS++))
else
  echo "✗ FAIL - Admin documents page does not exist"
  ((FAIL++))
fi

# Test 2: Check if documents list API exists
echo "[TEST 2/8] Checking if documents list API exists..."
if [ -f "src/app/api/admin/documents/route.ts" ]; then
  echo "✓ PASS - Documents list API exists"
  ((PASS++))
else
  echo "✗ FAIL - Documents list API does not exist"
  ((FAIL++))
fi

# Test 3: Check if approve API exists
echo "[TEST 3/8] Checking if approve API exists..."
if [ -f "src/app/api/admin/documents/[documentId]/approve/route.ts" ]; then
  echo "✓ PASS - Approve API exists"
  ((PASS++))
else
  echo "✗ FAIL - Approve API does not exist"
  ((FAIL++))
fi

# Test 4: Check if reject API exists
echo "[TEST 4/8] Checking if reject API exists..."
if [ -f "src/app/api/admin/documents/[documentId]/reject/route.ts" ]; then
  echo "✓ PASS - Reject API exists"
  ((PASS++))
else
  echo "✗ FAIL - Reject API does not exist"
  ((FAIL++))
fi

# Test 5: Check API has admin authorization
echo "[TEST 5/8] Checking API has admin authorization..."
if grep -q "role !== 'MASTER' && decoded.role !== 'ADMIN'" "src/app/api/admin/documents/route.ts"; then
  echo "✓ PASS - Admin authorization check present"
  ((PASS++))
else
  echo "✗ FAIL - Admin authorization check not found"
  ((FAIL++))
fi

# Test 6: Check approve API updates owner verification
echo "[TEST 6/8] Checking approve API updates owner verification..."
if grep -q "UPDATE hangar_owners" "src/app/api/admin/documents/[documentId]/approve/route.ts"; then
  echo "✓ PASS - Owner verification update logic present"
  ((PASS++))
else
  echo "✗ FAIL - Owner verification update logic not found"
  ((FAIL++))
fi

# Test 7: Check UI has image display
echo "[TEST 7/8] Checking UI has image display..."
if grep -q "window.open.*file_url" "src/app/admin/documents/page.tsx"; then
  echo "✓ PASS - Image display functionality present"
  ((PASS++))
else
  echo "✗ FAIL - Image display functionality not found"
  ((FAIL++))
fi

# Test 8: Check UI has approve/reject buttons
echo "[TEST 8/8] Checking UI has approve/reject buttons..."
if grep -q "handleApprove\|handleReject" "src/app/admin/documents/page.tsx"; then
  echo "✓ PASS - Approve/reject handlers present"
  ((PASS++))
else
  echo "✗ FAIL - Approve/reject handlers not found"
  ((FAIL++))
fi

echo ""
echo "=========================================="
echo "Test Results: $PASS/$((PASS + FAIL)) tests passed"
echo "=========================================="

if [ $FAIL -eq 0 ]; then
  echo "✓ ALL TESTS PASSED - Task 4.2 Implementation Verified"
  exit 0
else
  echo "✗ SOME TESTS FAILED - Please review implementation"
  exit 1
fi
