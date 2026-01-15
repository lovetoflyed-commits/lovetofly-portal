import { NextResponse } from 'next/server';
import pool from '@/config/db';

// Helper function to calculate tax amounts for Brazilian taxes
function calculateTaxes(amount: number, taxType: string) {
  const taxes = {
    icms: 0,
    pis: 0,
    cofins: 0,
    iss: 0,
    ir: 0,
  };

  // Tax rates (Brazilian standard rates - can be customized)
  // These are general rates; specific rates depend on activity and regime
  
  switch (taxType) {
    case 'SERVICE': // ISS applies to services
      taxes.iss = amount * 0.05; // 5% ISS (standard)
      taxes.pis = amount * 0.0165; // 1.65% PIS
      taxes.cofins = amount * 0.076; // 7.6% COFINS
      taxes.ir = amount * 0.125; // 12.5% IR (on net profit estimation)
      break;
      
    case 'PRODUCT': // ICMS applies to products
      taxes.icms = amount * 0.18; // 18% ICMS (standard, varies by state)
      taxes.pis = amount * 0.0165; // 1.65% PIS
      taxes.cofins = amount * 0.076; // 7.6% COFINS
      break;
      
    case 'ADVERTISING':
    case 'SERVICE_FEE':
    case 'CONSULTING':
      taxes.iss = amount * 0.05; // 5% ISS for advertising/consulting
      taxes.pis = amount * 0.0165;
      taxes.cofins = amount * 0.076;
      taxes.ir = amount * 0.125;
      break;
      
    default:
      // General service/consulting rate
      taxes.pis = amount * 0.0165;
      taxes.cofins = amount * 0.076;
      break;
  }

  return taxes;
}

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
      SELECT id, company_id, transaction_type, category, amount, currency, status,
             payment_method, description, transaction_date, due_date, paid_date,
             icms_amount, pis_amount, cofins_amount, iss_amount, ir_amount,
             created_at, updated_at
      FROM financial_transactions
      WHERE company_id = $1
    `;
    const params: any[] = [companyId];

    if (startDate) {
      query += ` AND transaction_date >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND transaction_date <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` ORDER BY transaction_date DESC LIMIT 1000`;

    const result = await pool.query(query, params);

    return NextResponse.json({ transactions: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching financial transactions:', error);
    return NextResponse.json({ message: 'Error fetching transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      company_id,
      transaction_type, // INCOME, EXPENSE, TRANSFER, REFUND
      category,
      amount,
      currency = 'BRL',
      status = 'pending',
      income_source_id,
      payment_method,
      description,
      transaction_date,
      due_date,
      paid_date,
      tax_type,
    } = body;

    if (!company_id || !transaction_type || !category || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields: company_id, transaction_type, category, amount' },
        { status: 400 }
      );
    }

    // Calculate taxes based on transaction type
    const taxes = transaction_type === 'INCOME' 
      ? calculateTaxes(amount, tax_type || category)
      : { icms: 0, pis: 0, cofins: 0, iss: 0, ir: 0 };

    const totalTax = taxes.icms + taxes.pis + taxes.cofins + taxes.iss + taxes.ir;

    const result = await pool.query(
      `INSERT INTO financial_transactions 
       (company_id, transaction_type, category, amount, currency, status, 
        income_source_id, payment_method, description, transaction_date, 
        due_date, paid_date, icms_amount, pis_amount, cofins_amount, 
        iss_amount, ir_amount, tax_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        company_id,
        transaction_type,
        category,
        amount,
        currency,
        status,
        income_source_id,
        payment_method,
        description,
        transaction_date || new Date().toISOString().split('T')[0],
        due_date,
        paid_date,
        taxes.icms,
        taxes.pis,
        taxes.cofins,
        taxes.iss,
        taxes.ir,
        totalTax > 0 ? (totalTax / amount * 100).toFixed(2) : 0,
      ]
    );

    return NextResponse.json({ transaction: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating financial transaction:', error);
    return NextResponse.json({ message: 'Error creating transaction' }, { status: 500 });
  }
}
