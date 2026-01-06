import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const icaoCode = searchParams.get('icao')?.toUpperCase();

  if (!icaoCode || icaoCode.length < 2) {
    return NextResponse.json(
      { error: 'ICAO code is required (2+ characters)' },
      { status: 400 }
    );
  }

  try {
    // Query airport_icao table with exact match or prefix search
    const result = await pool.query(
      `SELECT icao_code, iata_code, airport_name, city, state, country, is_public 
       FROM airport_icao 
       WHERE icao_code = $1 OR icao_code LIKE $2 
       ORDER BY 
         CASE 
           WHEN icao_code = $1 THEN 1 
           ELSE 2 
         END
       LIMIT 10`,
      [icaoCode, `${icaoCode}%`]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Airport not found', icao: icaoCode },
        { status: 404 }
      );
    }

    // Return single airport if exact match, otherwise return array
    if (result.rows.length === 1 || result.rows[0].icao_code === icaoCode) {
      return NextResponse.json(result.rows[0]);
    }
    
    return NextResponse.json({ airports: result.rows });
  } catch (error: any) {
    console.error('Error searching airports:', error);
    return NextResponse.json(
      { error: 'Failed to search airports', details: error?.message },
      { status: 500 }
    );
  }
}
