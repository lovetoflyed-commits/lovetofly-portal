# Next Agent старт — Love to Fly Portal (2026-01-28)

## ✅ Current State
- Dev server is running (localhost:3000).
- Admin dashboard now shows alert counters + inbox preview + floating alert popup.
- Staff can send messages and create tasks from the admin dashboard via modals.
- /admin/dashboard redirects to /admin so Traslados module is visible.
- Hydration mismatch on /courses fixed by loading Sidebar client-only.

## ✅ Recent Changes (Code)
- Admin dashboard alerts/inbox + modals:
  - src/app/admin/page.tsx
- Notifications list now includes metadata:
  - src/app/api/notifications/list/route.ts
- Staff message API:
  - src/app/api/admin/team-messages/route.ts
- Staff task API (create + update):
  - src/app/api/admin/tasks/route.ts
- /admin/dashboard redirect:
  - src/app/admin/dashboard/page.tsx
- /courses hydration fix (Sidebar dynamic import):
  - src/app/courses/page.tsx
- Middleware/proxy conflict resolved: src/middleware.ts removed.
- Turbopack dev filesystem cache disabled in next.config.ts.

## ✅ Known Working
- Admin login redirects to /admin for master/admin/staff.
- Notifications list API works with Authorization bearer token.
- Dev server starts without the previous “persistence database” error.

## 🔴 NEXT TASK (Start Here)
Build the full admin inbox and tasks modules:
1) Create /admin/inbox page with:
   - List of staff notifications
   - Filters by category (Team/Tasks/Traslados/System) and unread
   - Bulk mark read/dismiss
   - Detail view for messages and tasks
2) Create /admin/tasks page with:
   - Task list view (status, priority, assignee, due date)
   - Status updates and reassignment
   - Optional filters
3) Add staff notification preferences UI (email/WhatsApp/push opt-in)

## 📌 Notes
- Staff messages/tasks currently use user_notifications table (type: staff_message, staff_task).
- Task status is stored in notification metadata (taskStatus, dueDate).
- If you need new tables later, create new migrations (00X_*.sql). Do not edit old migrations.

## ✅ Docs Updated
- TODO list: TODO_LIST_JANUARY_26_2026.md
- Project status: PROJECT_STATUS_TODO_AND_FLIGHTTOOLS_ANALYSIS_2026-01-28.md
