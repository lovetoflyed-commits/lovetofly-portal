#!/bin/bash

# 🔧 CLEANUP SCRIPT - Pages & Files Audit Fixes
# Date: January 13, 2026
# Purpose: Remove orphaned files and directories

set -e  # Exit on error

echo "🧹 Starting cleanup process..."
echo ""

# 1. Delete orphaned tools 2 folder
if [ -d "src/app/tools 2" ]; then
  echo "🗑️  Removing orphaned directory: src/app/tools 2/"
  rm -rf "src/app/tools 2"
  echo "✅ Deleted src/app/tools 2/"
else
  echo "⏭️  src/app/tools 2 not found (already deleted?)"
fi

echo ""

# 2. Delete broken profile API route (wrong extension)
if [ -f "src/app/api/user/profile/route.tsx" ]; then
  echo "🗑️  Removing duplicate API file: src/app/api/user/profile/route.tsx"
  rm src/app/api/user/profile/route.tsx
  echo "✅ Deleted src/app/api/user/profile/route.tsx"
else
  echo "⏭️  src/app/api/user/profile/route.tsx not found (already deleted?)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CLEANUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Run: npm run build"
echo "2. Check for any TypeScript errors"
echo "3. Test: http://localhost:3000/admin/finance"
echo "4. Test: http://localhost:3000/admin/business"
echo ""
echo "For missing pages (/mentorship, /career/my-applications, etc):"
echo "See PAGES_AND_FILES_AUDIT.md for options (A, B, or C)"
echo ""
