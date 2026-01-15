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
    const result = await pool.query('SELECT * FROM invoices ORDER BY due_date ASC LIMIT 100');
    return NextResponse.json({ invoices: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching invoices:', error);
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
      'INSERT INTO invoices (contract_id, amount, due_date, paid_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [body.contract_id, body.amount, body.due_date, body.paid_date, body.status || 'unpaid']
    );
    return NextResponse.json({ invoice: insert.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
