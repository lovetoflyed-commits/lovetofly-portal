#!/bin/bash

# Integration Test Runner
# Runs all integration tests and provides summary

echo "=========================================="
echo "Love to Fly Portal - Integration Test Suite"
echo "=========================================="
echo ""

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TESTS_DIR="$(dirname "$0")"

echo "Configuration:"
echo "- Base URL: $BASE_URL"
echo "- Tests Directory: $TESTS_DIR"
echo ""

# Check if server is running
echo "Checking server availability..."
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200\|301\|302"; then
  echo "✓ Server is reachable at $BASE_URL"
else
  echo "✗ Server is not reachable at $BASE_URL"
  echo "  Please start the development server with: npm run dev"
  exit 1
fi
echo ""

# Track overall results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and track results
run_test() {
  local test_file=$1
  local test_name=$2
  
  echo "=========================================="
  echo "Running: $test_name"
  echo "=========================================="
  
  if [ ! -f "$test_file" ]; then
    echo "✗ Test file not found: $test_file"
    ((FAILED_TESTS++))
    return
  fi
  
  chmod +x "$test_file"
  
  if bash "$test_file"; then
    echo "✓ $test_name PASSED"
    ((PASSED_TESTS++))
  else
    echo "✗ $test_name FAILED"
    ((FAILED_TESTS++))
  fi
  
  ((TOTAL_TESTS++))
  echo ""
}

# Run all integration tests
echo "=========================================="
echo "Starting Integration Test Suite"
echo "=========================================="
echo ""

run_test "$TESTS_DIR/01-user-auth-flow.test.sh" "User Authentication Flow"
run_test "$TESTS_DIR/02-password-reset-flow.test.sh" "Password Reset Flow"
run_test "$TESTS_DIR/03-owner-onboarding-flow.test.sh" "Owner Onboarding Flow"

# Final summary
echo "=========================================="
echo "Integration Test Suite Summary"
echo "=========================================="
echo ""
echo "Total Test Suites: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo "✓✓✓ ALL INTEGRATION TESTS PASSED ✓✓✓"
  echo ""
  echo "The portal is ready for:"
  echo "  - User registration and authentication"
  echo "  - Password reset flows"
  echo "  - Hangar owner onboarding"
  echo "  - Listing creation with rate limiting"
  echo ""
  exit 0
else
  echo "✗✗✗ SOME INTEGRATION TESTS FAILED ✗✗✗"
  echo ""
  echo "Please review the failures above and fix issues before deployment."
  echo ""
  exit 1
fi
