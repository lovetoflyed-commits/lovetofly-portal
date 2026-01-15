import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');

  if (!companyId) {
    return NextResponse.json({ message: 'company_id is required' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `SELECT id, company_id, sponsor_name, sponsorship_type, amount, 
              currency, start_date, end_date, status, notes, created_at
       FROM sponsorships
       WHERE company_id = $1
       ORDER BY start_date DESC`,
      [companyId]
    );

    return NextResponse.json({ sponsorships: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching sponsorships:', error);
    return NextResponse.json({ message: 'Error fetching sponsorships' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      company_id,
      sponsor_name,
      sponsor_cnpj_cpf,
      contact_email,
      sponsorship_type,
      description,
      amount,
      currency = 'BRL',
      start_date,
      end_date,
      income_source_id,
      contract_id,
    } = body;

    if (!company_id || !sponsor_name || !sponsorship_type) {
      return NextResponse.json(
        { message: 'Missing required fields: company_id, sponsor_name, sponsorship_type' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO sponsorships 
       (company_id, sponsor_name, sponsor_cnpj_cpf, contact_email, sponsorship_type, 
        description, amount, currency, start_date, end_date, income_source_id, contract_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        company_id,
        sponsor_name,
        sponsor_cnpj_cpf,
        contact_email,
        sponsorship_type,
        description,
        amount,
        currency,
        start_date,
        end_date,
        income_source_id,
        contract_id,
      ]
    );

    return NextResponse.json({ sponsorship: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating sponsorship:', error);
    return NextResponse.json({ message: 'Error creating sponsorship' }, { status: 500 });
  }
}
