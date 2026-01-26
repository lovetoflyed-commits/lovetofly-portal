import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import pool from '@/config/db';

const SECRET = process.env.JWT_SECRET || 'your-secret-key';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lovetofly.com.br';

async function createNotification({
  userId,
  title,
  message,
  type,
  priority = 'normal',
  requestId,
}: {
  userId: number;
  title: string;
  message: string;
  type: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  requestId: number;
}) {
  const existing = await pool.query(
    `SELECT id FROM user_notifications
     WHERE user_id = $1
       AND type = $2
       AND (metadata->>'request_id')::int = $3
     LIMIT 1`,
    [userId, type, requestId]
  );

  if (existing.rows.length > 0) {
    return false;
  }

  await pool.query(
    `INSERT INTO user_notifications
      (user_id, type, title, message, priority, action_url, action_label, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      userId,
      type,
      title,
      message,
      priority,
      '/traslados/messages',
      'Ver traslado',
      JSON.stringify({ request_id: requestId }),
    ]
  );

  return true;
}

async function sendAgreementEmail({
  email,
  subject,
  title,
  message,
}: {
  email: string;
  subject: string;
  title: string;
  message: string;
}) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set; agreement email skipped');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #1e3a8a; color: white; padding: 16px; border-radius: 8px 8px 0 0; }
      .content { background: #f8fafc; padding: 16px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; }
      .button { display: inline-block; background: #1e40af; color: white; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header"><h2>${title}</h2></div>
      <div class="content">
        <p>${message}</p>
        <a class="button" href="${APP_URL}/traslados/messages">Abrir mensagens</a>
      </div>
    </div>
  </body>
</html>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Love to Fly Portal <noreply@lovetofly.com.br>',
      to: email,
      subject,
      html,
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let payload: any;
    try {
      payload = jwt.verify(token, SECRET);
    } catch (error) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId ?? payload.id;
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await request.json();
    if (!requestId) {
      return NextResponse.json({ message: 'Missing requestId' }, { status: 400 });
    }

    const requestResult = await pool.query(
      `SELECT id, user_id, assigned_to, agreement_owner_confirmed_at, agreement_pilot_confirmed_at
       FROM traslados_requests WHERE id = $1`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    const requestRow = requestResult.rows[0];
    let updateField: string | null = null;

    if (requestRow.user_id === Number(userId)) {
      updateField = 'agreement_owner_confirmed_at';
    } else if (requestRow.assigned_to === Number(userId)) {
      updateField = 'agreement_pilot_confirmed_at';
    } else {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const alreadyConfirmed = Boolean(requestRow[updateField]);
    if (!alreadyConfirmed) {
      await pool.query(
        `UPDATE traslados_requests
         SET ${updateField} = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [requestId]
      );
    }

    await pool.query(
      `UPDATE traslados_requests
       SET agreement_confirmed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
         AND agreement_owner_confirmed_at IS NOT NULL
         AND agreement_pilot_confirmed_at IS NOT NULL
         AND agreement_confirmed_at IS NULL`,
      [requestId]
    );

    const updated = await pool.query(
      `SELECT id, agreement_owner_confirmed_at, agreement_pilot_confirmed_at, agreement_confirmed_at
       FROM traslados_requests WHERE id = $1`,
      [requestId]
    );

    if (!alreadyConfirmed) {
      const isOwner = requestRow.user_id === Number(userId);
      const counterpartId = isOwner ? requestRow.assigned_to : requestRow.user_id;
      const actorLabel = isOwner ? 'proprietário' : 'piloto';

      if (counterpartId) {
        const created = await createNotification({
          userId: counterpartId,
          type: 'traslados_agreement_update',
          title: 'Acordo de traslado atualizado',
          message: `O ${actorLabel} confirmou o acordo do TR-${requestId}.`,
          priority: 'normal',
          requestId,
        });

        const counterpartEmailResult = await pool.query('SELECT email FROM users WHERE id = $1', [counterpartId]);
        const counterpartEmail = counterpartEmailResult.rows[0]?.email;
        if (created && counterpartEmail) {
          await sendAgreementEmail({
            email: counterpartEmail,
            subject: `Acordo atualizado • TR-${requestId}`,
            title: 'Acordo de traslado atualizado',
            message: `O ${actorLabel} confirmou o acordo do TR-${requestId}.`,
          });
        }
      }
    }

    if (updated.rows[0]?.agreement_confirmed_at) {
      const ownerId = requestRow.user_id;
      const pilotId = requestRow.assigned_to;
      const targets = [ownerId, pilotId].filter((id) => Boolean(id)) as number[];

      const notificationResults = await Promise.all(
        targets.map((targetId) =>
          createNotification({
            userId: targetId,
            type: 'traslados_agreement_confirmed',
            title: 'Acordo confirmado',
            message: `O acordo do traslado TR-${requestId} foi confirmado. A taxa do portal está liberada.`,
            priority: 'high',
            requestId,
          })
        )
      );

      const emailResult = await pool.query('SELECT id, email FROM users WHERE id = ANY($1::int[])', [targets]);
      await Promise.all(
        emailResult.rows.map((row, index) => {
          if (!notificationResults[index] || !row.email) {
            return Promise.resolve();
          }
          return sendAgreementEmail({
            email: row.email,
            subject: `Acordo confirmado • TR-${requestId}`,
            title: 'Acordo confirmado',
            message: `O acordo do traslado TR-${requestId} foi confirmado. A taxa do portal está liberada.`,
          });
        })
      );
    }

    return NextResponse.json({ request: updated.rows[0] }, { status: 200 });
  } catch (error) {
    console.error('Error confirming agreement:', error);
    return NextResponse.json({ message: 'Error confirming agreement' }, { status: 500 });
  }
}
