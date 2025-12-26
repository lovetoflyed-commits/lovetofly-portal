import { NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

function getAuthUserId(request: Request): number | null {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id?: number };
    return decoded?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // Optional simple admin guard for safety
  const adminSecretHeader = request.headers.get('x-admin-secret');
  if (!process.env.ADMIN_SECRET || adminSecretHeader !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = await pool.connect();
  try {
    const meId = getAuthUserId(request);

    await client.query('BEGIN');

    let meRowCount = 0;
    if (meId) {
      const meRes = await client.query('UPDATE users SET plan = $1 WHERE id = $2', ['pro', meId]);
      meRowCount = meRes.rowCount ?? 0;
    }

    const kaiserRes = await client.query("UPDATE users SET plan = 'pro' WHERE email ILIKE '%kaiser%'");
    const premiumRes = await client.query("UPDATE users SET plan = 'premium' WHERE plan IS DISTINCT FROM 'pro'");

    await client.query('COMMIT');

    return NextResponse.json({
      message: 'Plans updated: me + kaiser => pro; others => premium',
      meUpdated: meRowCount > 0,
      proUpdatedKaiser: kaiserRes.rowCount ?? 0,
      premiumUpdated: premiumRes.rowCount ?? 0,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('upgrade-plans error', error);
    return NextResponse.json({ error: 'Failed to upgrade plans' }, { status: 500 });
  } finally {
    client.release();
  }
}
