/**
 * POST /api/messages/[id]/report
 * Report a message for spam/abuse
 * 
 * Body:
 * - reason: 'spam' | 'harassment' | 'scam' | 'inappropriate' | 'phishing' | 'other'
 * - details: Optional additional context
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve(params);
    const messageId = parseInt(id);

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

    const reporterUserId = decoded.id || decoded.userId;

    // ============ Parse Body ============
    const body = await request.json();
    const { reason, details } = body;

    const validReasons = [
      'spam',
      'harassment',
      'scam',
      'inappropriate',
      'phishing',
      'other',
    ];

    if (!reason || !validReasons.includes(reason)) {
      return NextResponse.json(
        {
          message: 'Motivo inválido',
          validReasons,
        },
        { status: 400 }
      );
    }

    // ============ Check Message Exists ============
    const messageCheck = await pool.query(
      'SELECT sender_user_id, recipient_user_id FROM portal_messages WHERE id = $1',
      [messageId]
    );

    if (messageCheck.rows.length === 0) {
      return NextResponse.json(
        { message: 'Mensagem não encontrada' },
        { status: 404 }
      );
    }

    const message = messageCheck.rows[0];

    // Can only report messages you're involved in
    if (
      message.sender_user_id !== reporterUserId &&
      message.recipient_user_id !== reporterUserId
    ) {
      return NextResponse.json(
        { message: 'Você não pode reportar esta mensagem' },
        { status: 403 }
      );
    }

    // ============ Check for Duplicate Report ============
    const duplicateCheck = await pool.query(
      'SELECT id FROM portal_message_reports WHERE message_id = $1 AND reporter_user_id = $2',
      [messageId, reporterUserId]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        { message: 'Você já reportou esta mensagem' },
        { status: 400 }
      );
    }

    // ============ Insert Report ============
    const insertResult = await pool.query(
      `INSERT INTO portal_message_reports (
        message_id,
        reporter_user_id,
        reason,
        details,
        status
      ) VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id, created_at`,
      [messageId, reporterUserId, reason, details || null]
    );

    const report = insertResult.rows[0];

    // ============ Log Activity ============
    await pool.query(
      `INSERT INTO user_activity_log
        (user_id, activity_type, activity_category, description, details, target_type, target_id, status)
       VALUES ($1, 'message_reported', 'messaging', $2, $3, 'portal_message', $4, 'warning')`,
      [
        reporterUserId,
        `Mensagem reportada: ${reason}`,
        JSON.stringify({ message_id: messageId, reason, report_id: report.id }),
        messageId,
      ]
    );

    // ============ Response ============
    return NextResponse.json(
      {
        message: 'Mensagem reportada com sucesso. Nossa equipe irá revisar.',
        data: {
          reportId: report.id,
          createdAt: report.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error reporting message:', error);
    return NextResponse.json(
      { message: 'Erro ao reportar mensagem' },
      { status: 500 }
    );
  }
}
