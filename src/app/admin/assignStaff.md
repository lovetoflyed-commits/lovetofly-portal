# Assigning Staff to Roles

This document describes how to assign staff members to management roles in the portal, using the access control and staff template system.

## Steps

1. Define staff members and their roles in a data source (e.g., database, JSON, or TypeScript file).
2. Use the `accessControl.ts` logic to enforce permissions and check access for each staff member.
3. Integrate staff assignments into the admin dashboard for easy management and auditing.
4. Log all role assignments and changes for security and compliance.

## Example Assignment

See `assignStaffExample.ts` for a code example of assigning staff and checking permissions.

## Best Practices
- Only the Master can assign or change staff roles.
- All changes should be logged and auditable.
- Staff should only have access to their designated area and permissions.
- Escalation paths must be respected (e.g., Leads report to Master).

---

For implementation details, refer to:
- `accessControl.ts`
- `staffTemplate.json`
- `assignStaffExample.ts`
