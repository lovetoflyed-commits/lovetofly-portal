import { NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

const DAYS_BEFORE_DOWNGRADE = 3; // Warning grace period

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

    const userId = payload.id;
    const client = await pool.connect();
    try {
      const userRes = await client.query('SELECT email FROM users WHERE id = $1', [userId]);
      if (userRes.rowCount === 0) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      const userEmail = userRes.rows[0].email;

      const res = await client.query(
        `SELECT um.id, um.status, um.expires_at, mp.plan_code, mp.name as plan_name
         FROM user_memberships um
         JOIN membership_plans mp ON mp.id = um.plan_id
         WHERE um.user_id = $1`,
        [userId]
      );

      let effectivePlan = 'free';
      let membershipStatus = 'none';
      let dayRemaining = 0;
      let notificationSent = false;

      if ((res.rowCount ?? 0) > 0) {
        const m = res.rows[0];
        const now = Date.now();
        const expiresAt = new Date(m.expires_at).getTime();
        const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

        const expired = daysRemaining <= 0;
        const pastDue = daysRemaining > 0 && daysRemaining <= DAYS_BEFORE_DOWNGRADE;

        if (expired) {
          // Expired → downgrade to free
          await client.query(
            'UPDATE user_memberships SET status = $1, updated_at = NOW() WHERE id = $2',
            ['expired', m.id]
          );
          await client.query("UPDATE users SET plan = 'free' WHERE id = $1", [userId]);
          effectivePlan = 'free';
          membershipStatus = 'expired';
          dayRemaining = daysRemaining;
        } else if (pastDue) {
          // Past due: update status and send notification
          await client.query(
            'UPDATE user_memberships SET status = $1, updated_at = NOW() WHERE id = $2',
            ['past_due', m.id]
          );
          effectivePlan = m.plan_code;
          membershipStatus = 'past_due';
          dayRemaining = daysRemaining;

          // Send notification (in-app + email)
          try {
            const notifRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                email: userEmail,
                membership_status: 'past_due',
                plan_name: m.plan_name,
                days_remaining: daysRemaining,
              }),
            });
            notificationSent = notifRes.ok;
          } catch (e) {
            console.warn('Notification send failed:', e);
          }
        } else {
          // Active
          effectivePlan = m.plan_code;
          membershipStatus = 'active';
          dayRemaining = daysRemaining;
        }
      } else {
        // No membership → ensure free
        await client.query("UPDATE users SET plan = 'free' WHERE id = $1", [userId]);
        effectivePlan = 'free';
        membershipStatus = 'none';
      }

      return NextResponse.json(
        {
          plan: effectivePlan,
          status: membershipStatus,
          days_remaining: dayRemaining,
          notification_sent: notificationSent,
        },
        { status: 200 }
      );
    } catch (err: any) {
      console.error('Error checking/downgrading membership:', err);
      return NextResponse.json({ message: 'Error checking membership' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
