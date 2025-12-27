import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

/**
 * GET /api/hangarshare/airport-search?icao=SBSP
 * Busca informações do aeródromo pelo código ICAO
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const icao = searchParams.get('icao')?.toUpperCase().trim();

    if (!icao) {
      return NextResponse.json(
        { error: 'Código ICAO é obrigatório' },
        { status: 400 }
      );
    }

    if (icao.length !== 4) {
      return NextResponse.json(
        { error: 'Código ICAO deve ter 4 caracteres' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT 
        icao_code, 
        iata_code, 
        airport_name, 
        city, 
        state, 
        country,
        latitude,
        longitude,
        elevation_feet,
        is_public,
        has_facilities
       FROM airport_icao 
       WHERE icao_code = $1 
       LIMIT 1`,
      [icao]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { 
          error: 'Aeródromo não encontrado',
          suggestion: 'Verifique se o código ICAO está correto. Exemplos: SBSP, SBBR, SBGL'
        },
        { status: 404 }
      );
    }

    const airport = result.rows[0];

    return NextResponse.json({
      success: true,
      airport: {
        icaoCode: airport.icao_code,
        iataCode: airport.iata_code,
        name: airport.airport_name,
        city: airport.city,
        state: airport.state,
        country: airport.country,
        latitude: airport.latitude,
        longitude: airport.longitude,
        elevationFeet: airport.elevation_feet,
        isPublic: airport.is_public,
        hasFacilities: airport.has_facilities,
      }
    });

  } catch (error) {
    console.error('Erro ao buscar aeródromo:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar aeródromo no banco de dados' },
      { status: 500 }
    );
  }
}
