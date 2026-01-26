import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import pool from '@/config/db';

const SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_ROLES = new Set(['admin', 'staff', 'master']);

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX = /(\+?\d[\d\s().-]{7,}\d)/g;
const HANDLE_REGEX = /(^|\s)@[A-Za-z0-9_.]{2,}/g;
const SOCIAL_URL_REGEX = /(instagram\.com\/\S+|facebook\.com\/\S+|t\.me\/\S+|twitter\.com\/\S+|x\.com\/\S+|linkedin\.com\/\S+|wa\.me\/\S+)/gi;
const DEFAULT_FEE_BRL = Number(process.env.TRASLADOS_SERVICE_FEE_BRL || '500');

function sanitizeMessage(input: string) {
  let value = input;
  let redacted = false;

  const replacements = [
    { regex: EMAIL_REGEX, replace: '[email removido]' },
    { regex: SOCIAL_URL_REGEX, replace: '[link removido]' },
    { regex: PHONE_REGEX, replace: '[telefone removido]' },
    { regex: HANDLE_REGEX, replace: '$1[@ removido]' },
  ];

  replacements.forEach(({ regex, replace }) => {
    if (regex.test(value)) {
      redacted = true;
      value = value.replace(regex, replace);
    }
  });

  return {
    message: value.trim(),
    hasRedactions: redacted,
  };
}

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }

  const token = authHeader.substring(7);
  let payload: any;
  try {
    payload = jwt.verify(token, SECRET);
  } catch (error) {
    return { error: NextResponse.json({ message: 'Invalid token' }, { status: 401 }) };
  }

  const userId = payload.userId ?? payload.id;
  if (!userId) {
    return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }

  const userResult = await pool.query('SELECT id, role FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    return { error: NextResponse.json({ message: 'User not found' }, { status: 404 }) };
  }

  return { user: userResult.rows[0] };
}

async function resolveParticipant(requestId: number, userId: number, role: string) {
  const requestResult = await pool.query(
    `SELECT id, user_id, assigned_to, agreement_owner_confirmed_at, agreement_pilot_confirmed_at, agreement_confirmed_at
     FROM traslados_requests WHERE id = $1`,
    [requestId]
  );

  if (requestResult.rows.length === 0) {
    return { error: NextResponse.json({ message: 'Request not found' }, { status: 404 }) };
  }

  const requestRow = requestResult.rows[0];

  if (ADMIN_ROLES.has(role)) {
    return { request: requestRow, participantRole: 'admin' };
  }

  if (requestRow.user_id === userId) {
    return { request: requestRow, participantRole: 'owner' };
  }

  if (requestRow.assigned_to === userId) {
    return { request: requestRow, participantRole: 'pilot' };
  }

  return { error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) };
}

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const requestId = Number(searchParams.get('requestId'));

  if (!requestId) {
    return NextResponse.json({ message: 'Missing requestId' }, { status: 400 });
  }

  const participant = await resolveParticipant(requestId, Number(auth.user.id), auth.user.role);
  if ('error' in participant) return participant.error;

  try {
    const messagesResult = await pool.query(
      `SELECT id, request_id, sender_user_id, sender_role, message, has_redactions, created_at
       FROM traslados_messages
       WHERE request_id = $1
       ORDER BY created_at ASC`,
      [requestId]
    );

    let feePreview: {
      base_amount_cents: number;
      discount_cents: number;
      discount_reason: string | null;
      total_cents: number;
    } | null = null;

    if (participant.participantRole !== 'admin') {
      const userPlanResult = await pool.query('SELECT plan FROM users WHERE id = $1', [auth.user.id]);
      const userPlan = (userPlanResult.rows[0]?.plan || 'free').toLowerCase();
      const baseAmountCents = Math.round(DEFAULT_FEE_BRL * 100);
      const discountReason = userPlan === 'premium' ? 'premium_plan' : userPlan === 'pro' ? 'pro_plan' : null;
      const eligibleForDiscount = (participant.participantRole === 'owner' || participant.participantRole === 'pilot') && discountReason;
      const discountCents = eligibleForDiscount ? baseAmountCents : 0;
      feePreview = {
        base_amount_cents: baseAmountCents,
        discount_cents: discountCents,
        discount_reason: eligibleForDiscount ? discountReason : null,
        total_cents: baseAmountCents - discountCents,
      };
    }

    const feesResult = await pool.query(
      `SELECT * FROM traslados_service_fees WHERE request_id = $1 ORDER BY created_at DESC`,
      [requestId]
    );

    return NextResponse.json(
      {
        messages: messagesResult.rows,
        request: participant.request,
        role: participant.participantRole,
        fees: feesResult.rows,
        feePreview,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching traslados messages:', error);
    return NextResponse.json({ message: 'Error fetching messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const requestId = Number(body.requestId);
    const rawMessage = String(body.message || '').trim();

    if (!requestId || !rawMessage) {
      return NextResponse.json({ message: 'Missing requestId or message' }, { status: 400 });
    }

    const participant = await resolveParticipant(requestId, Number(auth.user.id), auth.user.role);
    if ('error' in participant) return participant.error;

    const { message, hasRedactions } = sanitizeMessage(rawMessage);

    if (!message) {
      return NextResponse.json({ message: 'Message content not allowed' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO traslados_messages (request_id, sender_user_id, sender_role, message, has_redactions)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, request_id, sender_user_id, sender_role, message, has_redactions, created_at`,
      [requestId, auth.user.id, participant.participantRole, message, hasRedactions]
    );

    return NextResponse.json({ message: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating traslados message:', error);
    return NextResponse.json({ message: 'Error creating message' }, { status: 500 });
  }
}
