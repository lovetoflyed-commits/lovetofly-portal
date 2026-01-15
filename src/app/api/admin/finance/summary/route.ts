import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');

  if (!companyId) {
    return NextResponse.json({ message: 'company_id is required' }, { status: 400 });
  }

  try {
    // Get income summary
    const incomeResult = await pool.query(
      `SELECT 
        SUM(amount) as total_income,
        COUNT(*) as transaction_count,
        SUM(icms_amount + pis_amount + cofins_amount + iss_amount + ir_amount) as total_taxes
      FROM financial_transactions
      WHERE company_id = $1 AND transaction_type = 'INCOME'
      AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)`,
      [companyId]
    );

    // Get expense summary
    const expenseResult = await pool.query(
      `SELECT 
        SUM(amount) as total_expenses,
        COUNT(*) as expense_count
      FROM expenses
      WHERE company_id = $1
      AND expense_date >= DATE_TRUNC('month', CURRENT_DATE)`,
      [companyId]
    );

    // Get pending invoices
    const pendingInvoicesResult = await pool.query(
      `SELECT 
        SUM(total_amount) as pending_amount,
        COUNT(*) as pending_count
      FROM invoices
      WHERE company_id = $1 AND status = 'unpaid'
      AND due_date <= CURRENT_DATE`,
      [companyId]
    );

    // Get tax summary
    const taxResult = await pool.query(
      `SELECT 
        SUM(calculated_amount) as total_taxes_due,
        array_agg(DISTINCT tax_type) as tax_types
      FROM tax_calculations
      WHERE company_id = $1 AND status = 'draft'`,
      [companyId]
    );

    const incomeData = incomeResult.rows[0];
    const expenseData = expenseResult.rows[0];
    const invoiceData = pendingInvoicesResult.rows[0];
    const taxData = taxResult.rows[0];

    const summary = {
      current_month: {
        total_income: parseFloat(incomeData.total_income || 0),
        total_taxes: parseFloat(incomeData.total_taxes || 0),
        net_income: parseFloat(incomeData.total_income || 0) - parseFloat(incomeData.total_taxes || 0),
        transaction_count: incomeData.transaction_count || 0,
      },
      expenses: {
        total_expenses: parseFloat(expenseData.total_expenses || 0),
        expense_count: expenseData.expense_count || 0,
      },
      invoices: {
        pending_amount: parseFloat(invoiceData.pending_amount || 0),
        pending_count: invoiceData.pending_count || 0,
      },
      taxes: {
        total_due: parseFloat(taxData.total_taxes_due || 0),
        tax_types: taxData.tax_types || [],
      },
    };

    return NextResponse.json({ summary }, { status: 200 });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    return NextResponse.json({ message: 'Error fetching summary' }, { status: 500 });
  }
}
