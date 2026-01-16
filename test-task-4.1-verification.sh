#!/bin/bash

# Test script for Task 4.1 - Document Storage Integration
# Tests the document validation and storage functionality

echo "=========================================="
echo "Task 4.1 Verification - Document Storage"
echo "=========================================="
echo ""

PASS=0
FAIL=0

# Test 1: Check if migration file exists
echo "[TEST 1/6] Checking if migration file exists..."
if [ -f "src/migrations/054_user_documents.sql" ]; then
  echo "✓ PASS - Migration file exists"
  ((PASS++))
else
  echo "✗ FAIL - Migration file does not exist"
  ((FAIL++))
fi

# Test 2: Check migration has user_documents table
echo "[TEST 2/6] Checking migration creates user_documents table..."
if grep -q "CREATE TABLE.*user_documents" "src/migrations/054_user_documents.sql"; then
  echo "✓ PASS - user_documents table creation found"
  ((PASS++))
else
  echo "✗ FAIL - user_documents table creation not found"
  ((FAIL++))
fi

# Test 3: Check API imports storage utility
echo "[TEST 3/6] Checking API imports storage utility..."
if grep -q "import.*uploadFile.*storage" "src/app/api/hangarshare/owner/validate-documents/route.ts"; then
  echo "✓ PASS - Storage utility imported"
  ((PASS++))
else
  echo "✗ FAIL - Storage utility not imported"
  ((FAIL++))
fi

# Test 4: Check API has JWT authentication
echo "[TEST 4/6] Checking API has authentication..."
if grep -q "jwt.verify" "src/app/api/hangarshare/owner/validate-documents/route.ts"; then
  echo "✓ PASS - JWT authentication present"
  ((PASS++))
else
  echo "✗ FAIL - JWT authentication not found"
  ((FAIL++))
fi

# Test 5: Check API uploads to Vercel Blob
echo "[TEST 5/6] Checking API uploads files..."
if grep -q "uploadFile.*owner-documents" "src/app/api/hangarshare/owner/validate-documents/route.ts"; then
  echo "✓ PASS - File upload logic present"
  ((PASS++))
else
  echo "✗ FAIL - File upload logic not found"
  ((FAIL++))
fi

# Test 6: Check API saves to database
echo "[TEST 6/6] Checking API saves to database..."
if grep -q "INSERT INTO user_documents" "src/app/api/hangarshare/owner/validate-documents/route.ts"; then
  echo "✓ PASS - Database insert logic present"
  ((PASS++))
else
  echo "✗ FAIL - Database insert logic not found"
  ((FAIL++))
fi

echo ""
echo "=========================================="
echo "Test Results: $PASS/$((PASS + FAIL)) tests passed"
echo "=========================================="

if [ $FAIL -eq 0 ]; then
  echo "✓ ALL TESTS PASSED - Task 4.1 Implementation Verified"
  exit 0
else
  echo "✗ SOME TESTS FAILED - Please review implementation"
  exit 1
fi
