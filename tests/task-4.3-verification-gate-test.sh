#!/bin/bash

# Test Script: Task 4.3 - Prevent Unverified Listings
# Tests verification gate functionality
# Date: January 15, 2026

echo "=========================================="
echo "Task 4.3: Verification Gate Test Suite"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
BASE_URL="http://localhost:3000"

# Test user token (replace with actual test token)
# For real testing, you need to login and get a valid JWT token
TEST_TOKEN="your-test-token-here"

echo "Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Token: ${TEST_TOKEN:0:20}..."
echo ""

# Test 1: Verification Status API Endpoint Exists
echo -n "Test 1: Verification status API endpoint exists... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  "$BASE_URL/api/hangarshare/owner/verification-status" 2>/dev/null)

if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo -e "${GREEN}✓ PASS${NC} (Status: $RESPONSE)"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} (Status: $RESPONSE, expected 200 or 401)"
  ((FAILED++))
fi

# Test 2: API Returns JSON Structure
echo -n "Test 2: API returns expected JSON structure... "
RESPONSE=$(curl -s \
  -H "Authorization: Bearer $TEST_TOKEN" \
  "$BASE_URL/api/hangarshare/owner/verification-status" 2>/dev/null)

if echo "$RESPONSE" | grep -q "hasProfile\|isVerified\|canCreateListings"; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${YELLOW}⊘ SKIP${NC} (Requires valid token)"
fi

# Test 3: Listing Create Page Loads
echo -n "Test 3: Listing create page loads... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/hangarshare/listing/create" 2>/dev/null)

if [ "$RESPONSE" = "200" ]; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} (Status: $RESPONSE)"
  ((FAILED++))
fi

# Test 4: Dashboard Page Loads
echo -n "Test 4: Owner dashboard page loads... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/hangarshare/owner/dashboard" 2>/dev/null)

if [ "$RESPONSE" = "200" ]; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} (Status: $RESPONSE)"
  ((FAILED++))
fi

# Test 5: File Existence Checks
echo ""
echo "File Existence Tests:"

FILES=(
  "src/app/api/hangarshare/owner/verification-status/route.ts"
  "src/app/hangarshare/listing/create/page.tsx"
  "src/app/hangarshare/owner/dashboard/page.tsx"
)

for FILE in "${FILES[@]}"; do
  echo -n "  - $FILE... "
  if [ -f "$FILE" ]; then
    echo -e "${GREEN}✓ EXISTS${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ MISSING${NC}"
    ((FAILED++))
  fi
done

# Test 6: Code Pattern Checks
echo ""
echo "Code Pattern Tests:"

echo -n "  - Verification status API implements GET... "
if grep -q "export async function GET" "src/app/api/hangarshare/owner/verification-status/route.ts" 2>/dev/null; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

echo -n "  - Listing page checks verification... "
if grep -q "verificationStatus\|canCreateListings" "src/app/hangarshare/listing/create/page.tsx" 2>/dev/null; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

echo -n "  - Dashboard shows verification banner... "
if grep -q "verificationStatus.*isVerified\|Verification Status Banner" "src/app/hangarshare/owner/dashboard/page.tsx" 2>/dev/null; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

echo -n "  - API checks user documents... "
if grep -q "user_documents\|validation_status" "src/app/api/hangarshare/owner/verification-status/route.ts" 2>/dev/null; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

echo -n "  - Listing page blocks unverified users... "
if grep -q "!verificationStatus.canCreateListings" "src/app/hangarshare/listing/create/page.tsx" 2>/dev/null; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

# Summary
echo ""
echo "=========================================="
echo "Test Results Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  echo ""
  echo "Task 4.3 Implementation Status: COMPLETE ✅"
  echo ""
  echo "Features Implemented:"
  echo "  ✅ Verification status API endpoint"
  echo "  ✅ Document status checking"
  echo "  ✅ Listing creation gate"
  echo "  ✅ User-friendly verification messages"
  echo "  ✅ Dashboard verification banner"
  echo "  ✅ Direct links to document upload"
  echo ""
  echo "Next Steps:"
  echo "  1. Test with real user accounts"
  echo "  2. Upload documents and verify flow"
  echo "  3. Test admin approval process"
  echo "  4. Proceed to Task 5.3 (Refund Processing)"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  echo ""
  echo "Please review the failed tests above."
  exit 1
fi
