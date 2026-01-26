import { NextRequest, NextResponse } from 'next/server';

import pool from '@/config/db';
import { requireAdmin } from '@/utils/adminAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'new';
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT 
        tr.*,
        requester.email as requester_email,
        requester.first_name as requester_first_name,
        requester.last_name as requester_last_name,
        assignee.email as assignee_email,
        assignee.first_name as assignee_first_name,
        assignee.last_name as assignee_last_name,
        fee.amount_cents as fee_amount_cents,
        fee.base_amount_cents as fee_base_amount_cents,
        fee.discount_cents as fee_discount_cents,
        fee.discount_reason as fee_discount_reason,
        fee.status as fee_status,
        fee.currency as fee_currency,
        fee.payer_role as fee_payer_role,
        fee.created_at as fee_created_at
      FROM traslados_requests tr
      LEFT JOIN users requester ON tr.user_id = requester.id
      LEFT JOIN users assignee ON tr.assigned_to = assignee.id
      LEFT JOIN LATERAL (
        SELECT *
        FROM traslados_service_fees
        WHERE request_id = tr.id
        ORDER BY created_at DESC
        LIMIT 1
      ) fee ON true
      WHERE tr.status = $1
      ORDER BY tr.created_at DESC
      LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM traslados_requests WHERE status = $1',
      [status]
    );

    return NextResponse.json({
      requests: result.rows,
      pagination: {
        page,
        limit,
        total: Number(countResult.rows[0].count),
        totalPages: Math.ceil(Number(countResult.rows[0].count) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching traslados requests:', error);
    return NextResponse.json({ message: 'Error fetching requests' }, { status: 500 });
  }
}
