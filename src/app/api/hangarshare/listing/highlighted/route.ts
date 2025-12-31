import { NextRequest, NextResponse } from 'next/server';
import db from '@/config/db';

export async function GET(req: NextRequest) {
  try {
    // Ajuste a query conforme o schema real da tabela hangar_listings
    const listings = await db.query(
      `SELECT id, hangar_number, icao_code, aerodrome_name, daily_rate, photos
       FROM hangar_listings
       WHERE status = 'active' AND is_available = true
         AND photos IS NOT NULL AND photos::text != '[]'
       ORDER BY updated_at DESC
       LIMIT 10`
    );
    return NextResponse.json({ listings: listings.rows });
  } catch (error: any) {
    console.error('Erro ao buscar hangares em destaque:', error);
    return NextResponse.json({ error: 'Erro ao buscar hangares em destaque', details: error?.message || error }, { status: 400 });
  }
}
