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
      `SELECT id, company_id, advertiser_name, campaign_name, amount, currency, 
              start_date, end_date, billing_frequency, status, created_at
       FROM advertising_revenue
       WHERE company_id = $1
       ORDER BY start_date DESC`,
      [companyId]
    );

    return NextResponse.json({ advertising_revenue: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching advertising revenue:', error);
    return NextResponse.json({ message: 'Error fetching advertising revenue' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      company_id,
      advertiser_name,
      advertiser_cnpj_cpf,
      contact_email,
      campaign_name,
      description,
      amount,
      currency = 'BRL',
      start_date,
      end_date,
      billing_frequency,
      income_source_id,
    } = body;

    if (!company_id || !advertiser_name || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields: company_id, advertiser_name, amount' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO advertising_revenue 
       (company_id, advertiser_name, advertiser_cnpj_cpf, contact_email, campaign_name, 
        description, amount, currency, start_date, end_date, billing_frequency, income_source_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        company_id,
        advertiser_name,
        advertiser_cnpj_cpf,
        contact_email,
        campaign_name,
        description,
        amount,
        currency,
        start_date || new Date().toISOString().split('T')[0],
        end_date,
        billing_frequency,
        income_source_id,
      ]
    );

    return NextResponse.json({ advertising_revenue: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating advertising revenue:', error);
    return NextResponse.json({ message: 'Error creating advertising revenue' }, { status: 500 });
  }
}
