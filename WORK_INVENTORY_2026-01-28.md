# Work Inventory — 2026-01-28

## Summary
- Fixed dev server startup issues (Turbopack cache + middleware/proxy conflict).
- Added admin alerts/inbox counters and floating notification popup.
- Added admin message/task modals and corresponding APIs.
- Redirected /admin/dashboard to /admin to surface Traslados module.
- Fixed /courses hydration mismatch by loading Sidebar client-only.

## Files Changed
- src/app/admin/page.tsx
  - Alerts header with counters and inbox
  - Floating popup for new alerts
  - Message + task modals
  - Notification polling + actions
- src/app/api/admin/team-messages/route.ts (new)
  - Broadcast staff messages using user_notifications
- src/app/api/admin/tasks/route.ts (new)
  - Create/update staff tasks using user_notifications metadata
- src/app/api/notifications/list/route.ts
  - Added metadata to notification response
- src/app/admin/dashboard/page.tsx
  - Redirect to /admin
- src/app/courses/page.tsx
  - Sidebar loaded client-only to fix hydration
- next.config.ts
  - Disabled Turbopack filesystem cache for dev

## Key Decisions
- Used existing user_notifications table for staff messages/tasks to avoid new migrations.
- Task status/due date stored in notification metadata.
- Admin dashboard is the canonical entry for modules (redirected /admin/dashboard).

## Open Items
- Build /admin/inbox page (full list + filters + bulk actions)
- Build /admin/tasks page (list + status + assignment)
- Add staff notification preferences (email/WhatsApp/push)
- Optional: add dedicated staff notification delivery channels
