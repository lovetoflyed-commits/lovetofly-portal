import type { ReactNode } from 'react';

/**
 * Permission Middleware
 * 
 * Server-side permission checking and RBAC enforcement
 * for admin dashboard operations
 */

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'staff';

export interface AdminPermissions {
  // User management
  view_users: boolean;
  edit_users: boolean;
  delete_users: boolean;
  approve_users: boolean;

  // HangarShare management
  view_hangars: boolean;
  edit_hangars: boolean;
  delete_hangars: boolean;
  approve_hangars: boolean;
  view_analytics: boolean;

  // Booking management
  view_bookings: boolean;
  edit_bookings: boolean;
  cancel_bookings: boolean;

  // Finance & Reports
  view_finance: boolean;
  export_finance: boolean;
  manage_payouts: boolean;

  // Compliance & Moderation
  view_audit_logs: boolean;
  manage_documents: boolean;
  handle_disputes: boolean;

  // System management
  manage_feature_flags: boolean;
  manage_coupons: boolean;
  manage_emails: boolean;
  view_system_logs: boolean;
}

// Role-based permission matrix
const ROLE_PERMISSIONS: Record<AdminRole, Partial<AdminPermissions>> = {
  super_admin: {
    // All permissions
    view_users: true,
    edit_users: true,
    delete_users: true,
    approve_users: true,
    view_hangars: true,
    edit_hangars: true,
    delete_hangars: true,
    approve_hangars: true,
    view_analytics: true,
    view_bookings: true,
    edit_bookings: true,
    cancel_bookings: true,
    view_finance: true,
    export_finance: true,
    manage_payouts: true,
    view_audit_logs: true,
    manage_documents: true,
    handle_disputes: true,
    manage_feature_flags: true,
    manage_coupons: true,
    manage_emails: true,
    view_system_logs: true,
  },

  admin: {
    // Most permissions except system management
    view_users: true,
    edit_users: true,
    approve_users: true,
    view_hangars: true,
    edit_hangars: true,
    approve_hangars: true,
    view_analytics: true,
    view_bookings: true,
    edit_bookings: true,
    cancel_bookings: true,
    view_finance: true,
    export_finance: true,
    view_audit_logs: true,
    manage_documents: true,
    handle_disputes: true,
  },

  moderator: {
    // Moderation and basic management
    view_users: true,
    view_hangars: true,
    view_bookings: true,
    view_analytics: true,
    view_audit_logs: true,
    manage_documents: true,
    handle_disputes: true,
  },

  staff: {
    // Read-only access
    view_users: true,
    view_hangars: true,
    view_bookings: true,
    view_analytics: true,
  },
};

/**
 * Get permissions for a given role
 */
export function getPermissionsForRole(role: AdminRole): AdminPermissions {
  return {
    view_users: false,
    edit_users: false,
    delete_users: false,
    approve_users: false,
    view_hangars: false,
    edit_hangars: false,
    delete_hangars: false,
    approve_hangars: false,
    view_analytics: false,
    view_bookings: false,
    edit_bookings: false,
    cancel_bookings: false,
    view_finance: false,
    export_finance: false,
    manage_payouts: false,
    view_audit_logs: false,
    manage_documents: false,
    handle_disputes: false,
    manage_feature_flags: false,
    manage_coupons: false,
    manage_emails: false,
    view_system_logs: false,
    ...ROLE_PERMISSIONS[role],
  };
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  role: AdminRole,
  permission: keyof AdminPermissions
): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions[permission] === true;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  role: AdminRole,
  permissions: (keyof AdminPermissions)[]
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(
  role: AdminRole,
  permissions: (keyof AdminPermissions)[]
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Middleware function for Express/Next.js route handlers
 * Ensures user has required permission
 */
export function requirePermission(...requiredPermissions: (keyof AdminPermissions)[]) {
  return (req: any, res: any, next: any) => {
    const userRole = req.user?.role as AdminRole;

    if (!userRole) {
      return res.status(401).json({ message: 'Unauthorized: No user role' });
    }

    if (!hasAllPermissions(userRole, requiredPermissions)) {
      return res.status(403).json({
        message: 'Forbidden: Insufficient permissions',
        required: requiredPermissions,
      });
    }

    next();
  };
}

/**
 * Client-side permission check
 * Use in React components to show/hide UI based on permissions
 */
export function useAdminPermissions(userRole: AdminRole) {
  return {
    permissions: getPermissionsForRole(userRole),
    can: (permission: keyof AdminPermissions) => hasPermission(userRole, permission),
    canAny: (permissions: (keyof AdminPermissions)[]) =>
      hasAnyPermission(userRole, permissions),
    canAll: (permissions: (keyof AdminPermissions)[]) =>
      hasAllPermissions(userRole, permissions),
  };
}

/**
 * Component wrapper for permission gating
 */
export function PermissionGate({
  permission,
  userRole,
  children,
  fallback = null,
}: {
  permission: keyof AdminPermissions;
  userRole: AdminRole;
  children: ReactNode;
  fallback?: ReactNode;
}): ReactNode {
  return hasPermission(userRole, permission) ? children : fallback;
}

/**
 * Audit log permission-restricted access
 */
export function canViewAuditLogs(role: AdminRole): boolean {
  return hasPermission(role, 'view_audit_logs');
}

export function canManageUsers(role: AdminRole): boolean {
  return hasPermission(role, 'edit_users');
}

export function canManageHangars(role: AdminRole): boolean {
  return hasPermission(role, 'edit_hangars');
}

export function canViewFinance(role: AdminRole): boolean {
  return hasPermission(role, 'view_finance');
}

export function canExportData(role: AdminRole): boolean {
  return hasAnyPermission(role, ['export_finance']);
}

export function canManageFeatures(role: AdminRole): boolean {
  return hasPermission(role, 'manage_feature_flags');
}
