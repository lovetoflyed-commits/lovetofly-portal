import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        ho.id,
        ho.user_id,
        ho.company_name,
        ho.cnpj,
        ho.tax_classification,
        ho.verification_status,
        u.first_name,
        u.last_name,
        u.email
      FROM hangar_owners ho
      JOIN users u ON ho.user_id = u.id
      ORDER BY ho.created_at DESC
      LIMIT 500
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching HangarShare owners:', error);
    return NextResponse.json(
      { message: 'Error fetching owners' },
      { status: 500 }
    );
  }
}
