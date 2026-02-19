#!/bin/bash

# ============================================
# PIX Integration - Setup Validation Script
# ============================================
# This script validates that all PIX components are correctly configured

set -e

echo "🔍 PIX Integration Setup Validation"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0

# Check function
check() {
  local name=$1
  local description=$2
  local result=$3

  if [ "$result" = "true" ]; then
    echo -e "${GREEN}✓${NC} $name - $description"
  else
    echo -e "${RED}✗${NC} $name - $description"
    ((errors++))
  fi
}

# ============ 1. Environment Variables ============
echo "1️⃣  Environment Variables"
echo "------------------------"

if [ -f .env.local ]; then
  check "ENV_LOCAL" ".env.local file exists" "true"
  
  if grep -q "PIX_WEBHOOK_SECRET" .env.local; then
    check "WEBHOOK_SECRET" "PIX_WEBHOOK_SECRET configured" "true"
  else
    check "WEBHOOK_SECRET" "PIX_WEBHOOK_SECRET configured" "false"
  fi

  if grep -q "PIX_RECONCILE_SECRET" .env.local; then
    check "RECONCILE_SECRET" "PIX_RECONCILE_SECRET configured" "true"
  else
    check "RECONCILE_SECRET" "PIX_RECONCILE_SECRET configured" "false"
  fi

  if grep -q "PIX_KEY" .env.local; then
    check "PIX_KEY" "PIX_KEY configured" "true"
  else
    check "PIX_KEY" "PIX_KEY configured" "false"
  fi
else
  check "ENV_LOCAL" ".env.local file exists" "false"
fi

echo ""

# ============ 2. Database Migrations ============
echo "2️⃣  Database Migrations"
echo "----------------------"

if [ -f "src/migrations/114_add_pix_payment_system.sql" ]; then
  check "MIGRATION_114" "PIX payment system migration exists" "true"
else
  check "MIGRATION_114" "PIX payment system migration exists" "false"
fi

echo ""

# ============ 3. API Routes ============
echo "3️⃣  API Routes"
echo "--------------"

routes=(
  "src/app/api/payments/pix/create/route.ts:Payment creation endpoint"
  "src/app/api/payments/pix/status/\[orderId\]/route.ts:Payment status endpoint"
  "src/app/api/payments/pix/webhook/route.ts:Webhook handler"
  "src/app/api/payments/pix/reconcile/route.ts:Reconciliation endpoint"
  "src/app/api/admin/pix-reconcile/route.ts:Admin reconciliation tool"
)

for route in "${routes[@]}"; do
  IFS=':' read -r path desc <<< "$route"
  path="src/app/api/payments/pix/create/route.ts"
  [ -f "$path" ] && exists="true" || exists="false"
  check "ROUTE_$(basename $path)" "$desc" "$exists"
done

echo ""

# ============ 4. Frontend Pages ============
echo "4️⃣  Frontend Payment Pages"
echo "---------------------------"

pages=(
  "src/app/user/membership/pix-payment/page.tsx:Membership payment page"
  "src/app/user/bookings/pix-payment/page.tsx:Booking payment page"
)

for page in "${pages[@]}"; do
  IFS=':' read -r path desc <<< "$page"
  [ -f "$path" ] && exists="true" || exists="false"
  check "PAGE_$(basename $(dirname $path))" "$desc" "$exists"
done

echo ""

# ============ 5. Utility Files ============
echo "5️⃣  Utility Files"
echo "----------------"

if [ -f "src/utils/pixUtils.ts" ]; then
  check "PIX_UTILS" "PIX utilities exist" "true"
  
  if grep -q "generateBRCode" src/utils/pixUtils.ts; then
    check "BRCODE_GEN" "BRCode generation function exists" "true"
  else
    check "BRCODE_GEN" "BRCode generation function exists" "false"
  fi

  if grep -q "generateQRCode" src/utils/pixUtils.ts; then
    check "QRCODE_GEN" "QR code generation function exists" "true"
  else
    check "QRCODE_GEN" "QR code generation function exists" "false"
  fi
else
  check "PIX_UTILS" "PIX utilities exist" "false"
fi

echo ""

# ============ 6. Documentation ============
echo "6️⃣  Documentation"
echo "----------------"

docs=(
  "openapi.json:OpenAPI specification"
  ".env.pix.example:Environment variables template"
  "PIX_SETUP_GUIDE.md:Complete setup guide"
)

for doc in "${docs[@]}"; do
  IFS=':' read -r path desc <<< "$doc"
  [ -f "$path" ] && exists="true" || exists="false"
  check "DOC_$(basename $path)" "$desc" "$exists"
done

echo ""

# ============ Summary ============
echo "=================================="
if [ $errors -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Run: npm run migrate:up"
  echo "2. Update .env.local with Asaas credentials"
  echo "3. Register webhook with Asaas"
  echo "4. Start dev server: npm run dev"
  echo "5. Test: curl -X POST http://localhost:3000/api/payments/pix/create"
  exit 0
else
  echo -e "${RED}❌ Found $errors issue(s)${NC}"
  echo ""
  echo "See PIX_SETUP_GUIDE.md for detailed setup instructions"
  exit 1
fi
