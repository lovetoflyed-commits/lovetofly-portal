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
      `SELECT it.id, it.account_code, it.account_name, it.account_type, 
              it.category, it.sub_category, it.is_active, it.description,
              it.created_at, it.updated_at
       FROM financial_accounts it
       WHERE it.is_active = true
       ORDER BY it.account_code ASC`,
      []
    );

    return NextResponse.json({ accounts: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching financial accounts:', error);
    return NextResponse.json({ message: 'Error fetching accounts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      account_code,
      account_name,
      account_type,
      category,
      sub_category,
      parent_account_id,
      description,
    } = body;

    if (!account_code || !account_name || !account_type || !category) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO financial_accounts (account_code, account_name, account_type, category, sub_category, parent_account_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [account_code, account_name, account_type, category, sub_category, parent_account_id, description]
    );

    return NextResponse.json({ account: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating financial account:', error);
    return NextResponse.json({ message: 'Error creating account' }, { status: 500 });
  }
}
