import { NextResponse, NextRequest } from 'next/server';
import pool from '@/config/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    // JWT validation (pseudo-code, replace with actual validation)
    // const token = authHeader.split(' ')[1];
    // const user = jwt.verify(token, process.env.JWT_SECRET);
    // if (!user || user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    const result = await pool.query('SELECT * FROM financial_transactions ORDER BY created_at DESC LIMIT 100');
    return NextResponse.json({ transactions: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    // JWT validation (pseudo-code, replace with actual validation)
    // const token = authHeader.split(' ')[1];
    // const user = jwt.verify(token, process.env.JWT_SECRET);
    // if (!user || user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    const body = await request.json();
    const insert = await pool.query(
      'INSERT INTO financial_transactions (type, amount, currency, status, description, user_id, related_contract_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [body.type, body.amount, body.currency || 'BRL', body.status || 'pending', body.description, body.user_id, body.related_contract_id]
    );
    return NextResponse.json({ transaction: insert.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
