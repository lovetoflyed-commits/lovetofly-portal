import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  if (!companyId) {
    return NextResponse.json({ message: 'company_id is required' }, { status: 400 });
  }

  try {
    let query = `
      SELECT id, company_id, expense_type, category, amount, currency, status, 
             vendor_name, expense_date, due_date, paid_date, created_at
      FROM expenses
      WHERE company_id = $1
    `;
    const params: any[] = [companyId];

    if (startDate) {
      query += ` AND expense_date >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND expense_date <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` ORDER BY expense_date DESC`;

    const result = await pool.query(query, params);

    return NextResponse.json({ expenses: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ message: 'Error fetching expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      company_id,
      expense_type,
      category,
      sub_category,
      amount,
      currency = 'BRL',
      description,
      vendor_name,
      vendor_cnpj_cpf,
      invoice_number,
      nf_number,
      expense_date,
      due_date,
      paid_date,
      payment_method,
    } = body;

    if (!company_id || !expense_type || !category || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields: company_id, expense_type, category, amount' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO expenses 
       (company_id, expense_type, category, sub_category, amount, currency, 
        description, vendor_name, vendor_cnpj_cpf, invoice_number, nf_number, 
        expense_date, due_date, paid_date, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        company_id,
        expense_type,
        category,
        sub_category,
        amount,
        currency,
        description,
        vendor_name,
        vendor_cnpj_cpf,
        invoice_number,
        nf_number,
        expense_date || new Date().toISOString().split('T')[0],
        due_date,
        paid_date,
        payment_method,
      ]
    );

    return NextResponse.json({ expense: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ message: 'Error creating expense' }, { status: 500 });
  }
}
