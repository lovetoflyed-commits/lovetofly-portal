# Structure Cleanup Plan (2026-01-28)

## Goal
Keep a single canonical route per feature, remove duplicates, and prevent future drift.

## Canonical Routes (keep)
- Auth: /login, /register, /forgot-password
- HangarShare (user): /hangarshare/*
- HangarShare (owner): /hangarshare/owner/*
- HangarShare (admin): /admin/hangarshare/*
- Classifieds: /classifieds/*
- Tools: /tools/* and /e6b (alias)
- Profile: /profile/*
- Logbook: /logbook
- Weather/Flight Planning: /weather, /flight-plan, /procedures/*
- Admin: /admin/*
- Staff: /staff/*

## Deprecated Routes (redirected already)
- /admin/hangarshare-v2 → /admin/hangarshare
- /admin/hangarshare/v2/financial → /admin/finance
- /admin/financial → /admin/finance
- /classifieds-preview → /classifieds/aircraft
- /owner/hangarshare/v2/dashboard → /hangarshare/owner/dashboard
- /tools 2/e6b → /tools/e6b

## Deprecated Files (safe to remove after verification)
- src/app/forgot-password.js
- src/app/classifieds-preview/page.tsx (after redirect validation)
- src/app/tools 2/e6b/page.tsx (after redirect validation)
- src/app/admin/hangarshare-v2/page.tsx (after redirect validation)
- src/app/admin/hangarshare/v2/financial/page.tsx (after redirect validation)
- src/app/owner/hangarshare/v2/dashboard/page.tsx (after redirect validation)

## Follow-up Tasks
1. Remove deprecated files listed above once redirects are confirmed in QA.
2. Update navigation to reference only canonical routes.
3. Add a short ROUTES.md with canonical route map.
4. Add a lint/check (optional) to flag folders with spaces (e.g., tools 2).

## Notes
- Keep redirects for one release cycle, then delete deprecated pages to reduce maintenance.
- Avoid new "preview" pages in production tree; use feature flags or staging branches instead.
