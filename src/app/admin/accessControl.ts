// Returns roles that can be assigned by the current role (cannot assign own or higher)
export function getAssignableRoles(currentRole: Role): Role[] {
  const hierarchy = [
    Role.MASTER,
    Role.OPERATIONS_LEAD,
    Role.SUPPORT_LEAD,
    Role.CONTENT_MANAGER,
    Role.BUSINESS_MANAGER,
    Role.FINANCE_MANAGER,
    Role.MARKETING,
    Role.COMPLIANCE,
  ];
  const idx = hierarchy.indexOf(currentRole);
  // Only roles below the current role can be assigned
  return idx >= 0 ? hierarchy.slice(idx + 1) : [];
}
// Portal Access Control and Management System
// Defines roles, permissions, and hierarchy for portal staff

export enum Role {
  MASTER = 'master',
  OPERATIONS_LEAD = 'operations_lead',
  SUPPORT_LEAD = 'support_lead',
  CONTENT_MANAGER = 'content_manager',
  BUSINESS_MANAGER = 'business_manager',
  FINANCE_MANAGER = 'finance_manager',
  MARKETING = 'marketing',
  COMPLIANCE = 'compliance',
}

export type Permission =
  | 'full_access'
  | 'manage_system'
  | 'manage_support'
  | 'manage_content'
  | 'manage_business'
  | 'manage_finance'
  | 'manage_marketing'
  | 'manage_compliance'
  | 'view_reports'
  | 'escalate_issues';

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.MASTER]: [
    'full_access',
    'manage_system',
    'manage_support',
    'manage_content',
    'manage_business',
    'manage_finance',
    'manage_marketing',
    'manage_compliance',
    'view_reports',
    'escalate_issues',
  ],
  [Role.OPERATIONS_LEAD]: [
    'manage_system',
    'view_reports',
    'escalate_issues',
  ],
  [Role.SUPPORT_LEAD]: [
    'manage_support',
    'view_reports',
    'escalate_issues',
  ],
  [Role.CONTENT_MANAGER]: [
    'manage_content',
    'view_reports',
    'escalate_issues',
  ],
  [Role.BUSINESS_MANAGER]: [
    'manage_business',
    'view_reports',
    'escalate_issues',
  ],
  [Role.FINANCE_MANAGER]: [
    'manage_finance',
    'view_reports',
    'escalate_issues',
  ],
  [Role.MARKETING]: [
    'manage_marketing',
    'view_reports',
    'escalate_issues',
  ],
  [Role.COMPLIANCE]: [
    'manage_compliance',
    'view_reports',
    'escalate_issues',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}
