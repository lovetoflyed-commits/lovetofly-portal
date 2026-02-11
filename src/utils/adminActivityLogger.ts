import pool from '@/config/db';

/**
 * Admin Activity Logger
 * Logs all admin actions to admin_activity_log table for audit trail
 */

export interface AdminActivityLogParams {
  adminId: number;
  actionType: 'create' | 'update' | 'delete' | 'restore' | 'suspend' | 'unsuspend' | 'role_change' | 'plan_change';
  targetType: 'user' | 'business' | 'content' | 'course' | 'hangar' | 'system';
  targetId: number | string;
  oldValue?: string | null;
  newValue?: string | null;
  notes?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Log an admin action to the audit trail
 */
export async function logAdminActivity(params: AdminActivityLogParams): Promise<void> {
  try {
    const {
      adminId,
      actionType,
      targetType,
      targetId,
      oldValue = null,
      newValue = null,
      notes = null,
      ipAddress = null,
      userAgent = null
    } = params;

    await pool.query(
      `INSERT INTO admin_activity_log 
       (admin_id, action_type, target_type, target_id, old_value, new_value, notes, ip_address, user_agent, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [adminId, actionType, targetType, targetId, oldValue, newValue, notes, ipAddress, userAgent]
    );

    console.log(`[AdminActivityLog] ${actionType} on ${targetType}:${targetId} by admin:${adminId}`);
  } catch (error) {
    console.error('[AdminActivityLog] Failed to log admin activity:', error);
    // Don't throw - logging failure shouldn't break the main operation
  }
}

/**
 * Extract IP address from request headers
 */
export function getIpFromRequest(request: Request): string | null {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  );
}

/**
 * Extract user agent from request headers
 */
export function getUserAgentFromRequest(request: Request): string | null {
  return request.headers.get('user-agent') || null;
}

/**
 * Helper to log user modifications with before/after values
 */
export async function logUserModification(
  adminId: number,
  actionType: 'update' | 'delete' | 'restore',
  userId: number,
  oldData: Record<string, any>,
  newData: Record<string, any> | null,
  request?: Request
): Promise<void> {
  const changes: string[] = [];
  
  if (actionType === 'delete') {
    changes.push(`Deleted user: ${oldData.email} (${oldData.first_name} ${oldData.last_name})`);
  } else if (actionType === 'restore') {
    changes.push(`Restored user: ${oldData.email}`);
  } else if (newData) {
    // Track what changed
    for (const key of Object.keys(newData)) {
      if (oldData[key] !== newData[key]) {
        changes.push(`${key}: "${oldData[key]}" → "${newData[key]}"`);
      }
    }
  }

  await logAdminActivity({
    adminId,
    actionType,
    targetType: 'user',
    targetId: userId,
    oldValue: JSON.stringify(oldData),
    newValue: newData ? JSON.stringify(newData) : null,
    notes: changes.join('; '),
    ipAddress: request ? getIpFromRequest(request) : null,
    userAgent: request ? getUserAgentFromRequest(request) : null
  });
}
