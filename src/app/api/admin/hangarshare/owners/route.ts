import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        ho.id,
        ho.company_name,
        ho.cnpj,
        ho.owner_type,
        ho.is_verified,
        ho.verification_status,
        COALESCE(ho.cpf, '') as cpf,
        COALESCE(u.email, '') as email,
        COALESCE(u.first_name, '') as first_name,
        COALESCE(u.last_name, '') as last_name,
        COALESCE(COUNT(hl.id), 0)::int as listings_count
      FROM hangar_owners ho
      LEFT JOIN users u ON u.id = ho.user_id
      LEFT JOIN hangar_listings hl ON hl.owner_id = ho.id
      GROUP BY ho.id, u.id
      ORDER BY ho.created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Error fetching HangarShare owners:', err);
    return NextResponse.json(
      { message: 'Error fetching owners', error: err },
      { status: 500 }
    );
  }
}
