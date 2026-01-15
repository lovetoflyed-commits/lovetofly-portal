import { NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = auth.replace('Bearer ', '');
    const secret = process.env.JWT_SECRET as string;
    let payload: any;
    try {
      payload = jwt.verify(token, secret);
    } catch (e) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
      const userId = payload.id;
      const res = await client.query(
        `SELECT um.id, um.status, um.expires_at, mp.plan_code 
         FROM user_memberships um 
         JOIN membership_plans mp ON mp.id = um.plan_id
         WHERE um.user_id = $1`
        , [userId]
      );

      let effectivePlan = null as string | null;
      let membershipStatus = 'none';
      if ((res.rowCount ?? 0) > 0) {
        const m = res.rows[0];
        membershipStatus = m.status;
        const expired = m.expires_at ? new Date(m.expires_at).getTime() < Date.now() : false;
        const pastDue = m.expires_at ? (new Date(m.expires_at).getTime() - Date.now() < 3 * 24 * 3600 * 1000 && !expired) : false;

        if (expired) {
          // Expired → downgrade to free
          await client.query('UPDATE user_memberships SET status = $1, updated_at = NOW() WHERE id = $2', ['expired', m.id]);
          await client.query("UPDATE users SET plan = 'free' WHERE id = $1", [userId]);
          effectivePlan = 'free';
          membershipStatus = 'expired';
        } else if (pastDue) {
          // Past due (about to expire)
          await client.query('UPDATE user_memberships SET status = $1, updated_at = NOW() WHERE id = $2', ['past_due', m.id]);
          effectivePlan = m.plan_code;
          membershipStatus = 'past_due';
        } else {
          effectivePlan = m.plan_code;
        }
      } else {
        // No membership → ensure free
        await client.query("UPDATE users SET plan = 'free' WHERE id = $1", [userId]);
        effectivePlan = 'free';
      }

      // Return effective plan so client can sync
      return NextResponse.json({ plan: effectivePlan, status: membershipStatus }, { status: 200 });
    } catch (err: any) {
      console.error('Erro ao verificar/downgrade membership:', err);
      return NextResponse.json({ message: 'Erro ao verificar membership' }, { status: 500 });
    } finally {
      (await pool).end; // no-op
    }
  } catch (error) {
    console.error('Erro descritivo:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
