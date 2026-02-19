import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { getAdminUser, logAdminAction, requireAdmin } from '@/utils/adminAuth';

export async function POST(request: NextRequest) {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }

  const { codeId, codeIds, reason } = body || {};
  const ids = Array.isArray(codeIds) ? codeIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)) : [];
  const resolvedIds = codeId ? [Number(codeId)].filter((id) => Number.isFinite(id)) : ids;
  if (resolvedIds.length === 0) {
    return NextResponse.json({ message: 'Code ID required.' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      'UPDATE codes SET is_active = FALSE WHERE id = ANY($1::int[]) RETURNING id, code_type, code_hint',
      [resolvedIds]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Code not found.' }, { status: 404 });
    }

    await logAdminAction(
      admin.id,
      'revoke',
      'codes',
      String(resolvedIds[0]),
      reason || (resolvedIds.length > 1 ? 'Revoked multiple codes' : 'Revoked code'),
      request
    );

    return NextResponse.json({
      message: 'Code revoked successfully.',
      data: result.rows
    }, { status: 200 });
  } catch (error) {
    console.error('Admin code revoke error:', error);
    return NextResponse.json({ message: 'Failed to revoke code.' }, { status: 500 });
  }
}
