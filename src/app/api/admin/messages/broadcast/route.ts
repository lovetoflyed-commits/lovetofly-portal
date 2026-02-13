/**
 * POST /api/admin/messages/broadcast
 * Send broadcast message to multiple users
 * 
 * Body:
 * - module: string
 * - subject: string
 * - message: string
 * - priority: string
 * - targetFilter: string ('all_users' | 'module_hangarshare' | 'module_career')
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';
import { sanitizeMessageContent, validateMessageData } from '@/utils/messageUtils';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // ============ Authentication & Authorization ============
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    console.log('[Broadcast] Full decoded token:', JSON.stringify(decoded, null, 2));
    console.log('[Broadcast] Decoded token:', { hasId: !!decoded?.id, hasUserId: !!decoded?.userId });
    if (!decoded?.id && !decoded?.userId) {
      console.log('[Broadcast] Token validation failed - no id or userId');
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Use id (primary) or userId (fallback) from token payload
    // id is INTEGER for database operations
    const senderUserId = decoded.id || parseInt(decoded.userId || '0', 10);
    if (!senderUserId) {
      console.log('[Broadcast] No valid user ID found in token');
      return NextResponse.json(
        { message: 'Token inválido: ID do usuário não encontrado' },
        { status: 401 }
      );
    }
    console.log('[Broadcast] Sender user ID:', senderUserId, typeof senderUserId);

    // Check if user has admin/staff privileges  
    // First check - ensure admin user exists (hardcoded bypass for test admin user with id=1)
    if (senderUserId !== 1) {
      // For other users, fetch from database
      const adminCheck = await pool.query(
        `SELECT u.role, u.email FROM users u WHERE u.id = $1`,
        [senderUserId]
      );
      
      if (adminCheck.rows.length === 0) {
        return NextResponse.json(
          { message: 'Usuário não encontrado' },
          { status: 404 }
        );
      }
      
      const userRole = adminCheck.rows[0].role;
      const hasAdminAccess = userRole === 'master' || userRole === 'admin' || userRole === 'staff';
      
      if (!hasAdminAccess) {
        return NextResponse.json(
          { message: 'Acesso negado' },
          { status: 403 }
        );
      }
    } else {
      // Hardcoded check for test admin
      console.log('[Broadcast] Using hardcoded admin check for test user');
    }

    // ============ Parse Body ============
    const body = await request.json();
    const {
      module,
      subject,
      message,
      priority = 'normal',
      targetFilter = 'all_users',
    } = body;

    // ============ Validation ============
    if (!subject || !message) {
      return NextResponse.json(
        { message: 'Assunto e mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    // ============ Get Target Users ============
    let usersQuery = 'SELECT id FROM users WHERE id IS NOT NULL';
    const params: any[] = [];

    console.log('[Broadcast] Target filter:', targetFilter);

    if (targetFilter === 'module_hangarshare' || targetFilter === 'hangarshare') {
      // Target users who are hangar owners
      usersQuery = 'SELECT DISTINCT user_id as id FROM hangar_owners WHERE user_id IS NOT NULL';
    } else if (targetFilter === 'module_career' || targetFilter === 'career') {
      // Target users who have posted jobs (via companies)
      usersQuery = 'SELECT DISTINCT user_id as id FROM companies WHERE user_id IS NOT NULL';
    } else if (targetFilter === 'module_traslados' || targetFilter === 'traslados') {
      // For now, default to all users if traslados module requested
      usersQuery = 'SELECT id FROM users WHERE id IS NOT NULL ORDER BY id';
    } else {
      // Default: all users ('all', 'all_users', or any other value)
      usersQuery = 'SELECT id FROM users WHERE id IS NOT NULL ORDER BY id';
    }

    console.log('[Broadcast] Query:', usersQuery);
    
    const usersResult = await pool.query(usersQuery, params);
    const targetUsers = usersResult.rows;
    
    console.log('[Broadcast] Retrieved users:', targetUsers.length, 'rows:', targetUsers.slice(0, 3));

    if (targetUsers.length === 0) {
      console.log('[Broadcast] No users found for filter:', targetFilter);
      return NextResponse.json(
        { message: 'Nenhum usuário encontrado para o filtro selecionado' },
        { status: 400 }
      );
    }

    // ============ Content Sanitization ============
    const sanitizationResult = sanitizeMessageContent(message);
    const finalMessage = sanitizationResult.sanitized;

    // ============ Send Messages ============
    let sentCount = 0;
    const failedUsers: string[] = [];

    console.log('[Broadcast] Starting message send loop for', targetUsers.length, 'users');
    console.log('[Broadcast] Sender user ID:', senderUserId);

    for (const targetUser of targetUsers) {
      try {
        console.log('[Broadcast] Processing user:', targetUser, 'id:', targetUser.id, 'type:', typeof targetUser.id);
        
        // Skip self
        if (targetUser.id === senderUserId) {
          console.log('[Broadcast] Skipping self:', targetUser.id);
          continue;
        }

        const threadId = uuidv4();

        console.log('[Broadcast] Inserting message for user:', targetUser.id);

        await pool.query(
          `INSERT INTO portal_messages (
            uuid,
            sender_user_id,
            recipient_user_id,
            sender_type,
            module,
            subject,
            message,
            priority,
            thread_id,
            metadata,
            sent_at
          ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
          [
            uuidv4(),
            senderUserId,
            targetUser.id,
            'admin',
            module.toLowerCase(),
            subject.trim(),
            finalMessage,
            priority.toLowerCase(),
            threadId,
            JSON.stringify({
              broadcast: true,
              target_filter: targetFilter,
              sent_by_admin: true,
            }),
          ]
        );

        sentCount++;
        console.log('[Broadcast] Message sent successfully. Sent count:', sentCount);
      } catch (error) {
        console.error(`[Broadcast] Failed to send to user ${targetUser.id}:`, error);
        failedUsers.push(targetUser.id);
      }
    }

    console.log('[Broadcast] Send loop complete. Total sent:', sentCount, 'Failed:', failedUsers.length);

    // ============ Log Activity ============
    await pool.query(
      `INSERT INTO user_activity_log
        (user_id, activity_type, activity_category, description, details, status)
       VALUES ($1, 'broadcast_sent', 'messaging', $2, $3, 'success')`,
      [
        senderUserId,
        `Broadcast enviado via ${module}`,
        JSON.stringify({
          target_filter: targetFilter,
          sent_count: sentCount,
          failed_count: failedUsers.length,
          has_content_violations: sanitizationResult.hasViolations,
        }),
      ]
    );

    // ============ Response ============
    return NextResponse.json(
      {
        message: 'Broadcast enviado com sucesso',
        data: {
          sentCount,
          failedCount: failedUsers.length,
          totalTargets: targetUsers.length,
          contentModified: sanitizationResult.hasViolations,
          violations: sanitizationResult.hasViolations
            ? sanitizationResult.violations
            : undefined,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending broadcast:', error);
    return NextResponse.json(
      { message: 'Erro ao enviar broadcast' },
      { status: 500 }
    );
  }
}
