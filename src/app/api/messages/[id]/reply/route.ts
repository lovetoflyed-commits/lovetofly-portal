/**
 * POST /api/messages/[id]/reply
 * Reply to a message (single reply - not unlimited thread)
 * 
 * Body:
 * - message: Reply content
 * - priority: Optional priority override
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';
import {
  sanitizeMessageContent,
  checkRateLimit,
  logMessageViolation,
  logRateLimitViolation,
} from '@/utils/messageUtils';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve(params);
    const parentMessageId = parseInt(id);

    // ============ Authentication ============
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!(decoded?.id || decoded?.userId)) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Normalize userId - keep as string since DB uses UUID
    const rawUserId = decoded.id ?? decoded.userId;
    const senderUserId = String(rawUserId || '');
      
    if (!senderUserId) {
      return NextResponse.json(
        { message: 'ID do usuário inválido' },
        { status: 401 }
      );
    }

    // Get sender's role to determine sender_type
    const senderInfo = await pool.query<{ role: string }>(
      'SELECT role FROM users WHERE id = $1',
      [senderUserId]
    );

    if (senderInfo.rows.length === 0) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const senderRole = senderInfo.rows[0].role;
    const senderType = ['admin', 'master', 'staff'].includes(senderRole) ? 'admin' : 'user';

    // ============ Parse Body ============
    const body = await request.json();
    const { message, priority } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { message: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    if (message.length > 10000) {
      return NextResponse.json(
        { message: 'Mensagem muito longa (máximo 10000 caracteres)' },
        { status: 400 }
      );
    }

    // ============ Check Parent Message Exists ============
    const parentResult = await pool.query(
      `SELECT 
        sender_user_id,
        recipient_user_id,
        module,
        subject,
        thread_id,
        priority,
        related_entity_type,
        related_entity_id,
        metadata
       FROM portal_messages
       WHERE id = $1`,
      [parentMessageId]
    );

    if (parentResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Mensagem original não encontrada' },
        { status: 404 }
      );
    }

    const parentMessage = parentResult.rows[0];

    // Normalize parent message IDs - keep as strings since DB uses UUID
    const parentSenderId = String(parentMessage.sender_user_id || '');
    const parentRecipientId = String(parentMessage.recipient_user_id || '');

    // Determine recipient (whoever didn't send this reply)
    const recipientUserId =
      parentSenderId === senderUserId
        ? parentRecipientId
        : parentSenderId;

    // ============ Check if Reply Already Exists (Single Reply Rule) ============
    const existingReplyCheck = await pool.query(
      `SELECT id FROM portal_messages
       WHERE parent_message_id = $1
         AND sender_user_id = $2`,
      [parentMessageId, senderUserId]
    );

    if (existingReplyCheck.rows.length > 0) {
      return NextResponse.json(
        {
          message:
            'Você já respondeu esta mensagem. Use a conversa existente para continuar.',
        },
        { status: 400 }
      );
    }

    // ============ Rate Limiting ============
    const rateLimit = await checkRateLimit(String(senderUserId), String(recipientUserId));
    if (!rateLimit.allowed) {
      await logRateLimitViolation(String(senderUserId), String(recipientUserId));
      return NextResponse.json(
        {
          message: rateLimit.message,
          resetIn: rateLimit.resetIn,
        },
        { status: 429 }
      );
    }

    // ============ Content Sanitization ============
    const sanitizationResult = sanitizeMessageContent(message);
    const finalMessage = sanitizationResult.sanitized;

    // ============ Insert Reply ============
    const finalPriority = priority || parentMessage.priority || 'normal';

    const insertResult = await pool.query(
      `INSERT INTO portal_messages (
        uuid,
        sender_user_id,
        recipient_user_id,
        sender_type,
        module,
        subject,
        message,
        priority,
        parent_message_id,
        thread_id,
        related_entity_type,
        related_entity_id,
        metadata,
        sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING id, uuid, sent_at`,
      [
        uuidv4(),
        senderUserId,
        recipientUserId,
        senderType,
        parentMessage.module,
        `Re: ${parentMessage.subject}`,
        finalMessage,
        finalPriority.toLowerCase(),
        parentMessageId,
        parentMessage.thread_id,
        (parentMessage.related_entity_type as string | null) ?? null,
        (parentMessage.related_entity_id as string | null) ?? null,
        parentMessage.metadata ? (typeof parentMessage.metadata === 'string' ? parentMessage.metadata : JSON.stringify(parentMessage.metadata)) : null,
      ]
    );

    const newReply = insertResult.rows[0];

    // ============ Log Violations (if any) ============
    if (sanitizationResult.hasViolations) {
      await logMessageViolation(
        newReply.id,
        String(senderUserId),
        sanitizationResult.violations
      );
    }

    // ============ Log Activity ============
    await pool.query(
      `INSERT INTO user_activity_log
        (user_id, activity_type, activity_category, description, details, target_type, target_id, status)
       VALUES ($1, 'message_replied', 'messaging', $2, $3, 'portal_message', $4, 'success')`,
      [
        senderUserId,
        `Resposta enviada via ${parentMessage.module}`,
        JSON.stringify({
          parent_message_id: parentMessageId,
          recipient_id: recipientUserId,
          has_content_violations: sanitizationResult.hasViolations,
        }),
        newReply.id,
      ]
    );

    // ============ Response ============
    return NextResponse.json(
      {
        message: 'Resposta enviada com sucesso',
        data: {
          id: newReply.id,
          uuid: newReply.uuid,
          sentAt: newReply.sent_at,
          parentMessageId,
          threadId: parentMessage.thread_id,
          remaining: rateLimit.remaining - 1,
          contentModified: sanitizationResult.hasViolations,
          violations: sanitizationResult.hasViolations
            ? sanitizationResult.violations
            : undefined,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending reply:', error);
    return NextResponse.json(
      { message: 'Erro ao enviar resposta' },
      { status: 500 }
    );
  }
}
