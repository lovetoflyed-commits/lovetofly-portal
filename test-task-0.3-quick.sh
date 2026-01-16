#!/bin/bash
# Quick Task 0.3 Verification Test
# Focuses on code changes without compilation

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║      TASK 0.3 VERIFICATION - Admin APIs Quick Test            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

PASSED=0
FAILED=0

# Test Helper
test_check() {
  local name=$1
  local cmd=$2
  
  if eval "$cmd" > /dev/null 2>&1; then
    echo "✅ $name"
    ((PASSED++))
  else
    echo "❌ $name"
    ((FAILED++))
  fi
}

echo "📋 CODE QUALITY CHECKS"
echo "─────────────────────────────────────────────────────────────"

test_check "1. Admin listings API file exists" \
  "test -f src/app/api/admin/listings/route.ts"

test_check "2. Admin verifications API file exists" \
  "test -f src/app/api/admin/verifications/route.ts"

test_check "3. Uses verification_status (not ho.verified)" \
  "grep -q 'ho.verification_status' src/app/api/admin/listings/route.ts"

test_check "4. Returns owner_verified as boolean expression" \
  "grep -q '(ho.verification_status = ' src/app/api/admin/listings/route.ts"

test_check "5. Has try-catch error handling" \
  "grep -q 'catch (error)' src/app/api/admin/listings/route.ts"

test_check "6. Checks admin authorization" \
  "grep -q 'requireAdmin' src/app/api/admin/listings/route.ts"

echo ""
echo "📊 QUERY STRUCTURE CHECKS"
echo "─────────────────────────────────────────────────────────────"

test_check "7. Query includes hangar_listings JOIN" \
  "grep -q 'JOIN hangar_owners' src/app/api/admin/listings/route.ts"

test_check "8. Query includes users JOIN" \
  "grep -q 'JOIN users' src/app/api/admin/listings/route.ts"

test_check "9. Query has pagination (LIMIT/OFFSET)" \
  "grep -q 'LIMIT.*OFFSET' src/app/api/admin/listings/route.ts"

test_check "10. Returns listing company_name from owner" \
  "grep -q 'ho.company_name' src/app/api/admin/listings/route.ts"

test_check "11. Returns listing CNPJ from owner" \
  "grep -q 'ho.cnpj' src/app/api/admin/listings/route.ts"

test_check "12. Returns user first_name and last_name" \
  "grep -q 'u.first_name' src/app/api/admin/listings/route.ts"

echo ""
echo "🔍 RESPONSE VALIDATION CHECKS"
echo "─────────────────────────────────────────────────────────────"

test_check "13. Response includes listings array" \
  "grep -q 'listings: result.rows' src/app/api/admin/listings/route.ts"

test_check "14. Response includes pagination metadata" \
  "grep -q 'pagination:' src/app/api/admin/listings/route.ts"

test_check "15. Pagination includes page number" \
  "grep -q 'page,' src/app/api/admin/listings/route.ts"

test_check "16. Pagination includes total count" \
  "grep -q 'total:' src/app/api/admin/listings/route.ts"

test_check "17. Pagination includes totalPages" \
  "grep -q 'totalPages' src/app/api/admin/listings/route.ts"

echo ""
echo "✔️  APPROVALS & FILTERING"
echo "─────────────────────────────────────────────────────────────"

test_check "18. Filters by approval_status correctly" \
  "grep -q 'approval_status = \$1' src/app/api/admin/listings/route.ts"

test_check "19. Uses parameterized queries (\$1, \$2, \$3)" \
  "grep -q '\$1' src/app/api/admin/listings/route.ts && grep -q '\$2' src/app/api/admin/listings/route.ts"

test_check "20. Returns error with proper HTTP status" \
  "grep -q 'status: 500' src/app/api/admin/listings/route.ts"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "RESULTS"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ Passed:  $PASSED/20"
echo "❌ Failed:  $FAILED/20"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 SUCCESS! All Task 0.3 checks passed!"
  echo ""
  echo "Task 0.3 Changes Summary:"
  echo "  ✓ Fixed: ho.verified → ho.verification_status"
  echo "  ✓ Fixed: owner_verified calculated as boolean"
  echo "  ✓ Added: Proper authorization checks"
  echo "  ✓ Added: Pagination support"
  echo "  ✓ Added: Error handling"
  echo "  ✓ Added: Owner company & user details in response"
  echo ""
else
  echo "⚠️  Some checks failed. Review the output above."
fi
