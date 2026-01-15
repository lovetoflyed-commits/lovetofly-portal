import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');
  const reportType = searchParams.get('report_type');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  if (!companyId) {
    return NextResponse.json({ message: 'company_id is required' }, { status: 400 });
  }

  try {
    let query = `
      SELECT id, company_id, report_type, report_name, start_date, end_date, 
             status, filing_date, filing_number, created_at
      FROM financial_reports
      WHERE company_id = $1
    `;
    const params: any[] = [companyId];

    if (reportType) {
      query += ` AND report_type = $${params.length + 1}`;
      params.push(reportType);
    }

    if (startDate) {
      query += ` AND start_date >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND end_date <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` ORDER BY start_date DESC`;

    const result = await pool.query(query, params);

    return NextResponse.json({ reports: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching financial reports:', error);
    return NextResponse.json({ message: 'Error fetching reports' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      company_id,
      report_type,
      report_name,
      start_date,
      end_date,
      report_data,
    } = body;

    if (!company_id || !report_type || !start_date || !end_date) {
      return NextResponse.json(
        { message: 'Missing required fields: company_id, report_type, start_date, end_date' },
        { status: 400 }
      );
    }

    // Generate report based on type
    let generatedReportData: any = {};

    if (report_type === 'DRE') {
      // Demonstrativo de Resultado do Exercício (Income Statement)
      generatedReportData = await generateDREReport(company_id, start_date, end_date);
    } else if (report_type === 'FLUXO_CAIXA') {
      // Fluxo de Caixa (Cash Flow)
      generatedReportData = await generateCashFlowReport(company_id, start_date, end_date);
    } else if (report_type === 'APURACAO_ICMS') {
      // ICMS Appraisal
      generatedReportData = await generateICMSReport(company_id, start_date, end_date);
    } else if (report_type === 'APURACAO_PIS_COFINS') {
      // PIS/COFINS Appraisal
      generatedReportData = await generatePISCOFINSReport(company_id, start_date, end_date);
    }

    const result = await pool.query(
      `INSERT INTO financial_reports 
       (company_id, report_type, report_name, start_date, end_date, report_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        company_id,
        report_type,
        report_name || `${report_type} - ${start_date} to ${end_date}`,
        start_date,
        end_date,
        JSON.stringify(generatedReportData || report_data),
      ]
    );

    return NextResponse.json({ report: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating financial report:', error);
    return NextResponse.json({ message: 'Error creating report' }, { status: 500 });
  }
}

// Helper function to generate DRE (Income Statement)
async function generateDREReport(companyId: string, startDate: string, endDate: string) {
  // Get all income transactions
  const incomeResult = await pool.query(
    `SELECT category, SUM(amount) as total, SUM(icms_amount + pis_amount + cofins_amount + iss_amount + ir_amount) as taxes
     FROM financial_transactions
     WHERE company_id = $1 AND transaction_type = 'INCOME' 
     AND transaction_date BETWEEN $2 AND $3
     GROUP BY category`,
    [companyId, startDate, endDate]
  );

  // Get all expense transactions
  const expenseResult = await pool.query(
    `SELECT category, SUM(amount) as total
     FROM expenses
     WHERE company_id = $1 
     AND expense_date BETWEEN $2 AND $3
     GROUP BY category`,
    [companyId, startDate, endDate]
  );

  const totalIncome = incomeResult.rows.reduce((sum: number, row: any) => sum + parseFloat(row.total || 0), 0);
  const totalTaxes = incomeResult.rows.reduce((sum: number, row: any) => sum + parseFloat(row.taxes || 0), 0);
  const totalExpenses = expenseResult.rows.reduce((sum: number, row: any) => sum + parseFloat(row.total || 0), 0);
  const netIncome = totalIncome - totalTaxes - totalExpenses;

  return {
    period: { start: startDate, end: endDate },
    income: {
      items: incomeResult.rows,
      total: totalIncome,
    },
    taxes: {
      total: totalTaxes,
    },
    expenses: {
      items: expenseResult.rows,
      total: totalExpenses,
    },
    net_income: netIncome,
    net_profit_margin: totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(2) : 0,
  };
}

// Helper function to generate Cash Flow Report
async function generateCashFlowReport(companyId: string, startDate: string, endDate: string) {
  const transactionsResult = await pool.query(
    `SELECT transaction_date, transaction_type, SUM(amount) as daily_total
     FROM financial_transactions
     WHERE company_id = $1 
     AND transaction_date BETWEEN $2 AND $3
     GROUP BY transaction_date, transaction_type
     ORDER BY transaction_date ASC`,
    [companyId, startDate, endDate]
  );

  return {
    period: { start: startDate, end: endDate },
    daily_cash_flow: transactionsResult.rows,
  };
}

// Helper function to generate ICMS Report
async function generateICMSReport(companyId: string, startDate: string, endDate: string) {
  const icmsResult = await pool.query(
    `SELECT SUM(icms_amount) as total_icms, COUNT(*) as transaction_count
     FROM financial_transactions
     WHERE company_id = $1 
     AND transaction_date BETWEEN $2 AND $3
     AND transaction_type = 'INCOME'`,
    [companyId, startDate, endDate]
  );

  return {
    period: { start: startDate, end: endDate },
    total_icms: parseFloat(icmsResult.rows[0]?.total_icms || 0),
    transaction_count: icmsResult.rows[0]?.transaction_count || 0,
    tax_type: 'ICMS',
    rate: 0.18, // Standard rate (varies by state)
  };
}

// Helper function to generate PIS/COFINS Report
async function generatePISCOFINSReport(companyId: string, startDate: string, endDate: string) {
  const taxResult = await pool.query(
    `SELECT SUM(pis_amount) as total_pis, SUM(cofins_amount) as total_cofins, COUNT(*) as transaction_count
     FROM financial_transactions
     WHERE company_id = $1 
     AND transaction_date BETWEEN $2 AND $3
     AND transaction_type = 'INCOME'`,
    [companyId, startDate, endDate]
  );

  const row = taxResult.rows[0];
  return {
    period: { start: startDate, end: endDate },
    total_pis: parseFloat(row?.total_pis || 0),
    total_cofins: parseFloat(row?.total_cofins || 0),
    transaction_count: row?.transaction_count || 0,
    pis_rate: 0.0165,
    cofins_rate: 0.076,
  };
}
