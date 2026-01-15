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

    // Only admin/master/staff can mark listings as paid
    if (!['master', 'admin', 'staff'].includes(payload.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { listing_id, amount, currency = 'BRL', description } = body;
    if (!listing_id || !amount) {
      return NextResponse.json({ message: 'Missing listing_id or amount' }, { status: 400 });
    }

    // Approve and mark listing available + paid
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update listing flags
      const upd = await client.query(
        `UPDATE hangar_listings 
         SET approval_status = 'approved', 
             availability_status = 'available', 
             is_paid = TRUE,
             paid_at = NOW(),
             paid_amount = $2,
             paid_currency = $3,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, owner_id, approval_status, availability_status, is_paid, paid_at, paid_amount, paid_currency`,
        [listing_id, amount, currency]
      );
      if (upd.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
      }
      const listing = upd.rows[0];

      // Resolve a company_id (use first company or create a default)
      let companyId: number | null = null;
      const companyRes = await client.query('SELECT id FROM companies ORDER BY id ASC LIMIT 1');
      if ((companyRes.rowCount ?? 0) > 0) {
        companyId = companyRes.rows[0].id;
      } else {
        const created = await client.query(
          `INSERT INTO companies (name, cnpj, created_at, updated_at)
           VALUES ('Love to Fly Portal', NULL, NOW(), NOW())
           RETURNING id`
        );
        companyId = created.rows[0].id;
      }

      // Record financial transaction (INCOME)
      await client.query(
        `INSERT INTO financial_transactions (
           company_id, transaction_type, category, amount, currency, status,
           description, user_id, transaction_date, created_at, updated_at
         ) VALUES ($1, 'INCOME', 'HANGARSHARE', $2, $3, 'confirmed',
           COALESCE($4, 'HangarShare listing payment'), $5, CURRENT_DATE, NOW(), NOW())`,
        [companyId, amount, currency, description, payload.id]
      );

      await client.query('COMMIT');
      return NextResponse.json({ message: 'Listing marked as paid', listing }, { status: 200 });
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Erro ao marcar anúncio como pago:', err);
      return NextResponse.json({ message: 'Erro ao registrar pagamento' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro descritivo:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
