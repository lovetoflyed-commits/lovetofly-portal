import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function POST() {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Ensure basic plans exist
      const plans = [
        { code: 'free', name: 'Gratuito', level: 0, price: 0 },
        { code: 'standard', name: 'Standard', level: 1, price: 49.9 },
        { code: 'premium', name: 'Premium', level: 2, price: 99.9 },
        { code: 'pro', name: 'Pro', level: 3, price: 199.9 },
      ];

      for (const p of plans) {
        await client.query(
          `INSERT INTO membership_plans(plan_code, name, level, price)
           VALUES($1,$2,$3,$4)
           ON CONFLICT(plan_code) DO UPDATE SET name=EXCLUDED.name, level=EXCLUDED.level, price=EXCLUDED.price, updated_at=NOW()`,
          [p.code, p.name, p.level, p.price]
        );
      }

      // Pick first 4 users for seeding
      const users = await client.query('SELECT id FROM users ORDER BY id ASC LIMIT 4');
      if ((users.rowCount ?? 0) < 1) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'No users to seed' }, { status: 400 });
      }

      const now = Date.now();
      const day = 24 * 3600 * 1000;

      const [u1, u2, u3, u4] = users.rows.map((r: any) => r.id);

      // Helpers to get plan id
      const planId = async (code: string) => {
        const r = await client.query('SELECT id FROM membership_plans WHERE plan_code=$1', [code]);
        return r.rows[0].id;
      };

      // 1: Active (expires in 15 days)
      await client.query(
        `INSERT INTO user_memberships(user_id, plan_id, status, starts_at, expires_at, last_payment_at)
         VALUES($1,$2,'active', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', NOW())
         ON CONFLICT(user_id) DO UPDATE SET plan_id=EXCLUDED.plan_id, status='active', starts_at=EXCLUDED.starts_at, expires_at=EXCLUDED.expires_at, last_payment_at=EXCLUDED.last_payment_at, updated_at=NOW()`,
        [u1, await planId('premium')]
      );
      await client.query("UPDATE users SET plan = 'premium' WHERE id = $1", [u1]);

      // 2: About to expire (expires in 2 days)
      await client.query(
        `INSERT INTO user_memberships(user_id, plan_id, status, starts_at, expires_at, last_payment_at)
         VALUES($1,$2,'past_due', NOW() - INTERVAL '28 days', NOW() + INTERVAL '2 days', NOW() - INTERVAL '28 days')
         ON CONFLICT(user_id) DO UPDATE SET plan_id=EXCLUDED.plan_id, status='past_due', starts_at=EXCLUDED.starts_at, expires_at=EXCLUDED.expires_at, last_payment_at=EXCLUDED.last_payment_at, updated_at=NOW()`,
        [u2, await planId('standard')]
      );
      await client.query("UPDATE users SET plan = 'standard' WHERE id = $1", [u2]);

      // 3: Expired (expired 5 days ago)
      await client.query(
        `INSERT INTO user_memberships(user_id, plan_id, status, starts_at, expires_at, last_payment_at)
         VALUES($1,$2,'expired', NOW() - INTERVAL '35 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '35 days')
         ON CONFLICT(user_id) DO UPDATE SET plan_id=EXCLUDED.plan_id, status='expired', starts_at=EXCLUDED.starts_at, expires_at=EXCLUDED.expires_at, last_payment_at=EXCLUDED.last_payment_at, updated_at=NOW()`,
        [u3, await planId('premium')]
      );
      await client.query("UPDATE users SET plan = 'free' WHERE id = $1", [u3]);

      // 4: Expired (expired 10 days ago)
      await client.query(
        `INSERT INTO user_memberships(user_id, plan_id, status, starts_at, expires_at, last_payment_at)
         VALUES($1,$2,'expired', NOW() - INTERVAL '40 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '40 days')
         ON CONFLICT(user_id) DO UPDATE SET plan_id=EXCLUDED.plan_id, status='expired', starts_at=EXCLUDED.starts_at, expires_at=EXCLUDED.expires_at, last_payment_at=EXCLUDED.last_payment_at, updated_at=NOW()`,
        [u4, await planId('pro')]
      );
      await client.query("UPDATE users SET plan = 'free' WHERE id = $1", [u4]);

      await client.query('COMMIT');
      return NextResponse.json({ message: 'Membership seed complete' }, { status: 200 });
    } catch (err: any) {
      await pool.query('ROLLBACK');
      console.error('Erro ao seed memberships:', err);
      return NextResponse.json({ message: 'Erro ao criar seeds' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro descritivo:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
