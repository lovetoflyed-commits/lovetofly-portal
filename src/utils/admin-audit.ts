/**
 * Audit Logging System
 * 
 * Comprehensive logging of all admin actions for compliance
 * and debugging purposes
 */

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resourceType: 'user' | 'hangar' | 'booking' | 'listing' | 'owner' | 'document' | 'setting';
  resourceId: string;
  resourceName: string;
  changes?: Record<string, any>; // Before/after comparison
  status: 'success' | 'error' | 'warning';
  message: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Create audit log entry in database
 */
export async function logAuditAction(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
): Promise<AuditLogEntry> {
  try {
    const response = await fetch('/api/admin/v2/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        ...entry,
        timestamp: new Date(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Audit logging failed: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Fail silently - don't break the action if logging fails
    throw error;
  }
}

/**
 * Helper functions for common audit log actions
 */

export async function logUserAction(
  userId: string,
  userName: string,
  userEmail: string,
  action: string,
  resourceType: AuditLogEntry['resourceType'],
  resourceId: string,
  resourceName: string,
  message: string,
  changes?: Record<string, any>,
  status: AuditLogEntry['status'] = 'success'
) {
  return logAuditAction({
    userId,
    userName,
    userEmail,
    action,
    resourceType,
    resourceId,
    resourceName,
    message,
    changes,
    status,
  });
}

export async function logDataChanged(
  userId: string,
  userName: string,
  userEmail: string,
  resourceType: AuditLogEntry['resourceType'],
  resourceId: string,
  resourceName: string,
  before: Record<string, any>,
  after: Record<string, any>
) {
  const changes: Record<string, any> = {};
  
  Object.keys(after).forEach((key) => {
    if (before[key] !== after[key]) {
      changes[key] = { before: before[key], after: after[key] };
    }
  });

  return logAuditAction({
    userId,
    userName,
    userEmail,
    action: 'update',
    resourceType,
    resourceId,
    resourceName,
    message: `Updated ${resourceType} "${resourceName}"`,
    changes,
    status: 'success',
  });
}

export async function logDeletion(
  userId: string,
  userName: string,
  userEmail: string,
  resourceType: AuditLogEntry['resourceType'],
  resourceId: string,
  resourceName: string,
  reason?: string
) {
  return logAuditAction({
    userId,
    userName,
    userEmail,
    action: 'delete',
    resourceType,
    resourceId,
    resourceName,
    message: `Deleted ${resourceType} "${resourceName}"${reason ? ` - ${reason}` : ''}`,
    status: 'success',
  });
}

export async function logApproval(
  userId: string,
  userName: string,
  userEmail: string,
  resourceType: AuditLogEntry['resourceType'],
  resourceId: string,
  resourceName: string,
  reason?: string
) {
  return logAuditAction({
    userId,
    userName,
    userEmail,
    action: 'approve',
    resourceType,
    resourceId,
    resourceName,
    message: `Approved ${resourceType} "${resourceName}"${reason ? ` - ${reason}` : ''}`,
    status: 'success',
  });
}

export async function logRejection(
  userId: string,
  userName: string,
  userEmail: string,
  resourceType: AuditLogEntry['resourceType'],
  resourceId: string,
  resourceName: string,
  reason: string
) {
  return logAuditAction({
    userId,
    userName,
    userEmail,
    action: 'reject',
    resourceType,
    resourceId,
    resourceName,
    message: `Rejected ${resourceType} "${resourceName}" - ${reason}`,
    status: 'warning',
  });
}

/**
 * Retrieve audit logs with filtering
 */
export async function getAuditLogs(filters?: {
  userId?: string;
  resourceType?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  const params = new URLSearchParams();

  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.resourceType) params.append('resourceType', filters.resourceType);
  if (filters?.action) params.append('action', filters.action);
  if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
  if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));

  const response = await fetch(`/api/admin/v2/audit-logs?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch audit logs');
  }

  return response.json();
}

/**
 * Export audit logs as CSV
 */
export async function exportAuditLogsAsCSV(filters?: any): Promise<string> {
  const data = await getAuditLogs({ ...filters, limit: 10000 });
  
  const headers = ['ID', 'Timestamp', 'User', 'Email', 'Action', 'Resource', 'Status', 'Message'];
  const rows = data.logs.map((log) => [
    log.id,
    log.timestamp.toISOString(),
    log.userName,
    log.userEmail,
    log.action,
    `${log.resourceType}/${log.resourceId}`,
    log.status,
    log.message,
  ]);

  let csv = headers.join(',') + '\n';
  rows.forEach((row) => {
    csv += row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
  });

  return csv;
}
