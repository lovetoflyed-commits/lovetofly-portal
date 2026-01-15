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
      `SELECT id, company_id, source_type, source_name, description, tax_treatment, 
              financial_account_id, is_active, created_at
       FROM income_sources
       WHERE company_id = $1
       ORDER BY source_name ASC`,
      [companyId]
    );

    return NextResponse.json({ income_sources: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching income sources:', error);
    return NextResponse.json({ message: 'Error fetching income sources' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      company_id,
      source_type,
      source_name,
      description,
      tax_treatment,
      financial_account_id,
    } = body;

    if (!company_id || !source_type || !source_name) {
      return NextResponse.json(
        { message: 'Missing required fields: company_id, source_type, source_name' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO income_sources (company_id, source_type, source_name, description, tax_treatment, financial_account_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [company_id, source_type, source_name, description, tax_treatment || 'TRIBUTED', financial_account_id]
    );

    return NextResponse.json({ income_source: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating income source:', error);
    return NextResponse.json({ message: 'Error creating income source' }, { status: 500 });
  }
}
