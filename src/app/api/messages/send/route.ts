/**
 * POST /api/messages/send
 * Send a new message in the Portal Messages System
 * 
 * Features:
 * - Token authentication
 * - Rate limiting (5 msg/hour per recipient)
 * - Content sanitization
 * - Module context validation
 * - Thread creation
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';
import {
  sanitizeMessageContent,
  checkRateLimit,
  validateMessageData,
  logMessageViolation,
  logRateLimitViolation,
} from '@/utils/messageUtils';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
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

    const senderUserId = String(decoded.id ?? decoded.userId ?? '');

    // ============ Parse Body ============
    const body = await request.json();
    const {
      recipientUserId: recipientUserIdRaw,
      module,
      subject,
      message,
      priority = 'normal',
      relatedEntityType,
      relatedEntityId,
      metadata,
    } = body;

    // Convert recipientUserId to string (UUIDs)
    const recipientUserId = String(recipientUserIdRaw || '');

    // ============ Validation ============
    const validation = validateMessageData({
      recipientUserId,
      module,
      subject,
      message,
      priority,
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          message: 'Dados inválidos',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // ============ Check Self-Send ============
    if (senderUserId === recipientUserId) {
      return NextResponse.json(
        { message: 'Não é possível enviar mensagem para si mesmo' },
        { status: 400 }
      );
    }

    // ============ Check Recipient Exists ============
    const recipientCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [recipientUserId]
    );

    if (recipientCheck.rows.length === 0) {
      return NextResponse.json(
        { message: 'Destinatário não encontrado' },
        { status: 404 }
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

    // ============ Insert Message ============
    const threadId = uuidv4();
    
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
        related_entity_type,
        related_entity_id,
        thread_id,
        metadata,
        sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING id, uuid, sent_at`,
      [
        uuidv4(),
        senderUserId,
        recipientUserId,
        'user',
        module.toLowerCase(),
        subject.trim(),
        finalMessage,
        priority.toLowerCase(),
        (relatedEntityType as string | null) ?? null,
        (relatedEntityId as string | null) ?? null,
        threadId,
        metadata ? JSON.stringify(metadata) as string : null,
      ]
    );

    const newMessage = insertResult.rows[0];

    // ============ Log Violations (if any) ============
    if (sanitizationResult.hasViolations) {
      await logMessageViolation(
        newMessage.id,
        String(senderUserId),
        sanitizationResult.violations
      );
    }

    // ============ Log Activity ============
    await pool.query(
      `INSERT INTO user_activity_log
        (user_id, activity_type, activity_category, description, details, target_type, target_id, status)
       VALUES ($1, 'message_sent', 'messaging', $2, $3, 'portal_message', $4, 'success')`,
      [
        senderUserId,
        `Mensagem enviada via ${module}`,
        JSON.stringify({
          recipient_id: recipientUserId,
          module,
          has_content_violations: sanitizationResult.hasViolations,
        }),
        newMessage.id,
      ]
    );

    // ============ Response ============
    return NextResponse.json(
      {
        message: 'Mensagem enviada com sucesso',
        data: {
          id: newMessage.id,
          uuid: newMessage.uuid,
          sentAt: newMessage.sent_at,
          threadId,
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
    console.error('Error sending message:', error);
    return NextResponse.json(
      { message: 'Erro ao enviar mensagem' },
      { status: 500 }
    );
  }
}
