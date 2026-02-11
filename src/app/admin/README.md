# Portal Admin System

This directory contains the management logic, access control, and documentation for the Love to Fly Portal staff hierarchy.

## Key Files
- `accessControl.ts`: Role/permission logic for all staff and management levels.
- `rolesHierarchy.md`: Human-readable documentation of staff areas, authority, and escalation paths.

## Next Steps
- Integrate `accessControl.ts` with authentication and dashboard routes.
- Build UI components for role-based access in the admin dashboard.
- Assign staff to roles and test permission boundaries.

## Security
- Master role is reserved for the portal owner only.
- All staff actions are logged and auditable.
- Escalation and override paths are enforced by code and policy.

---

For further details, see the documentation files in this directory.
