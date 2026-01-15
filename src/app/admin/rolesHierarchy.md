# Portal Management System: Roles & Access Hierarchy

## 1. Master
- Full access to all portal areas, settings, and override powers.
- Can manage, audit, and delegate any staff action.

## 2. Operations Lead
- High access to system health, maintenance, backups, deployments.
- Can view logs, trigger restores, and manage technical staff.

## 3. Support Lead
- Manage user tickets, onboarding, FAQs, and troubleshooting.
- Can escalate issues to Operations or Master.

## 4. Content/Community Manager
- Approve/edit content, moderate forums, manage news, banners, and listings.
- Can suspend users/posts, but not delete accounts.

## 5. Business/Employers Manager
- Oversee job postings, employer accounts, and application flows.
- Can approve/reject postings, manage employer profiles.

## 6. Finance Manager
- Access to payments, refunds, and financial reports.
- Can process refunds, view Stripe/Resend data, but not change system configs.

## 7. Marketing/Communications
- Manage notifications, banners, and user updates.
- Can schedule and send communications, but not edit core content.

## 8. Compliance/Security Officer
- Audit logs, review permissions, enforce policies.
- Can flag or temporarily restrict access, but not change user data.

---

- Each area’s staff have access only to their domain, with escalation paths to higher authority (Lead → Master).
- This structure ensures security, accountability, and operational clarity.
- For implementation, see `accessControl.ts` for role/permission logic.
