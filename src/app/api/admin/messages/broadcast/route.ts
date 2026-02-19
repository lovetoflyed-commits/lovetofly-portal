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

async function sendBroadcastEmail(options: {
  to: string;
  recipientName?: string | null;
  senderName?: string | null;
  module: string;
  subject: string;
  message: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return { sent: false, reason: 'missing_resend_key' };
  }

  const from = process.env.RESEND_FROM || 'Love to Fly <noreply@lovetofly.com.br>';
  const recipientLabel = options.recipientName || 'usuário';
  const senderLabel = options.senderName || 'Administração Love to Fly';

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;max-width:640px;margin:0 auto;">
      <h2 style="margin-bottom:8px;">Comunicado da administração</h2>
      <p>Olá, ${recipientLabel}.</p>
      <p>Você recebeu uma nova mensagem administrativa no módulo <strong>${options.module}</strong>.</p>
      <p><strong>Assunto:</strong> ${options.subject}</p>
      <p><strong>Remetente:</strong> ${senderLabel}</p>
      <div style="margin-top:12px;padding:12px;border:1px solid #e5e7eb;border-radius:8px;white-space:pre-wrap;">${options.message}</div>
      <p style="margin-top:16px;color:#666;font-size:12px;">Esta mensagem também está disponível no painel do usuário.</p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject: `[Love to Fly] ${options.subject}`,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend error (${response.status}): ${errorText}`);
  }

  return { sent: true };
}

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

    // Use id or userId from token payload (can be UUID or INTEGER)
    const senderUserId = decoded.id || decoded.userId;
    if (!senderUserId) {
      console.log('[Broadcast] No valid user ID found in token');
      return NextResponse.json(
        { message: 'Token inválido: ID do usuário não encontrado' },
        { status: 401 }
      );
    }
    
    const senderUserIdStr = String(senderUserId);
    console.log('[Broadcast] Sender user ID:', senderUserIdStr, 'type:', typeof senderUserId);

    // Check if user has admin/staff privileges
    try {
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
    } catch (authCheckErr) {
      console.error('[Broadcast] Auth check error:', authCheckErr);
      return NextResponse.json(
        { message: 'Erro ao verificar permissões' },
        { status: 500 }
      );
    }

    // ============ Parse Body ============
    const body = await request.json();
    const {
      module,
      subject,
      message,
      priority = 'normal',
      targetFilter = 'all_users',
      sendEmail = false,
    } = body;

    // ============ Validation ============
    if (!subject || !message) {
      return NextResponse.json(
        { message: 'Assunto e mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    // ============ Get Target Users ============
    let usersQuery = 'SELECT id, email, first_name, last_name FROM users WHERE id IS NOT NULL';
    const params: any[] = [];

    console.log('[Broadcast] Target filter:', targetFilter);

    if (targetFilter === 'module_hangarshare' || targetFilter === 'hangarshare') {
      // Target users who are hangar owners
      usersQuery = `
        SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
        FROM hangar_owners ho
        JOIN users u ON u.id = ho.user_id
        WHERE ho.user_id IS NOT NULL
      `;
    } else if (targetFilter === 'module_career' || targetFilter === 'career') {
      // Target users who have posted jobs (via companies)
      usersQuery = `
        SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
        FROM companies c
        JOIN users u ON u.id = c.user_id
        WHERE c.user_id IS NOT NULL
      `;
    } else if (targetFilter === 'module_traslados' || targetFilter === 'traslados') {
      // For now, default to all users if traslados module requested
      usersQuery = 'SELECT id, email, first_name, last_name FROM users WHERE id IS NOT NULL ORDER BY id';
    } else {
      // Default: all users ('all', 'all_users', or any other value)
      usersQuery = 'SELECT id, email, first_name, last_name FROM users WHERE id IS NOT NULL ORDER BY id';
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
    let emailSentCount = 0;
    const failedUsers: string[] = [];

    console.log('[Broadcast] Starting message send loop for', targetUsers.length, 'users');
    console.log('[Broadcast] Sender user ID:', senderUserId);

    for (const targetUser of targetUsers) {
      try {
        const targetUserId = String(targetUser.id);
        console.log('[Broadcast] Processing user:', targetUserId, 'type:', typeof targetUser.id);
        
        // Skip self
        if (targetUserId === senderUserIdStr) {
          console.log('[Broadcast] Skipping self:', targetUserId);
          continue;
        }

        const threadId = uuidv4();

        console.log('[Broadcast] Inserting message for user:', targetUserId);

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
            senderUserIdStr,
            targetUserId,
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

        if (sendEmail && targetUser.email) {
          try {
            const recipientName = [targetUser.first_name, targetUser.last_name].filter(Boolean).join(' ') || null;
            const emailResult = await sendBroadcastEmail({
              to: targetUser.email,
              recipientName,
              senderName: adminCheck.rows[0]?.email || 'Administração Love to Fly',
              module: module.toLowerCase(),
              subject: subject.trim(),
              message: finalMessage,
            });
            if (emailResult.sent) {
              emailSentCount++;
            }
          } catch (emailError) {
            console.error(`[Broadcast] Failed to send email to user ${targetUser.id}:`, emailError);
          }
        }

        sentCount++;
        console.log('[Broadcast] Message sent successfully. Sent count:', sentCount);
      } catch (error) {
        console.error(`[Broadcast] Failed to send to user ${targetUser.id}:`, error);
        failedUsers.push(String(targetUser.id));
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
          emailSentCount,
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
