#!/bin/bash

# Script to identify dynamic route handlers that need Next.js 16 async params fixes
# Routes with [param] patterns must await Promise.resolve(params)

echo "🔍 Searching for dynamic route handlers..."
echo ""

# Find all route.ts files in dynamic segments
DYNAMIC_ROUTES=$(find src/app/api -type f -name "route.ts" -path "*/\[*\]/*")

echo "📋 Found $(echo "$DYNAMIC_ROUTES" | wc -l | xargs) dynamic route handlers:"
echo ""
echo "$DYNAMIC_ROUTES"
echo ""

echo "⚠️  Routes that need manual review for async params:"
echo ""

for file in $DYNAMIC_ROUTES; do
  # Check if file contains params usage
  if grep -q "params\." "$file" 2>/dev/null; then
    echo "  ⚠️  $file"
    # Show lines where params is accessed
    grep -n "params\." "$file" | head -5
    echo ""
  fi
done

echo ""
echo "✅ Already fixed routes (using Promise.resolve):"
for file in $DYNAMIC_ROUTES; do
  if grep -q "Promise.resolve(params)" "$file" 2>/dev/null; then
    echo "  ✅ $file"
  fi
done

echo ""
echo "📝 Summary:"
echo "  - Check ⚠️  routes and apply: const { id } = await Promise.resolve(params);"
echo "  - Update type: { params: Promise<{ id: string }> }"
echo "  - Replace params.id with the destructured id variable"
