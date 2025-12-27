import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

/**
 * GET /api/hangarshare/search?icao=SBSP&city=São Paulo
 * Busca hangares disponíveis na tabela hangar_listings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const icao = searchParams.get('icao')?.toUpperCase().trim();
    const city = searchParams.get('city')?.trim();
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    // Permitir busca por preço mesmo sem cidade/ICAO
    const hasPriceFilter = (minPrice && Number(minPrice) > 0) || (maxPrice && Number(maxPrice) < 20000);
    
    if (!icao && !city && !hasPriceFilter) {
      return NextResponse.json(
        { error: 'Informe o código ICAO, cidade ou faixa de preço para buscar' },
        { status: 400 }
      );
    }

    let query = `
      SELECT 
        h.id,
        h.icao_code,
        h.aerodrome_name,
        h.city,
        h.state,
        h.country,
        h.hangar_number,
        h.hangar_location_description,
        h.hangar_size_sqm,
        h.max_wingspan_meters,
        h.max_length_meters,
        h.max_height_meters,
        h.accepted_aircraft_categories,
        h.hourly_rate,
        h.daily_rate,
        h.weekly_rate,
        h.monthly_rate,
        h.available_from,
        h.available_until,
        h.is_available,
        h.operating_hours,
        h.services,
        h.description,
        h.special_notes,
        h.accepts_online_payment,
        h.accepts_payment_on_arrival,
        h.accepts_payment_on_departure,
        h.cancellation_policy,
        h.verification_status,
        h.photos,
        h.status,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name
      FROM hangar_listings h
      LEFT JOIN users u ON h.owner_id = u.id
      WHERE h.status = 'active' 
        AND h.is_available = true
    `;

    const params: any[] = [];
    
    if (icao) {
      params.push(icao);
      query += ` AND h.icao_code = $${params.length}`;
    }
    
    if (city) {
      params.push(`%${city}%`);
      query += ` AND (h.city ILIKE $${params.length} OR h.state ILIKE $${params.length})`;
    }

    // Price filters
    if (minPrice && Number(minPrice) > 0) {
      params.push(Number(minPrice));
      query += ` AND h.monthly_rate >= $${params.length}`;
    }

    if (maxPrice && Number(maxPrice) < 20000) {
      params.push(Number(maxPrice));
      query += ` AND h.monthly_rate <= $${params.length}`;
    }

    query += ` ORDER BY h.created_at DESC LIMIT 50`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      // Verificar se o aeródromo existe na tabela airport_icao
      if (icao) {
        const airportCheck = await pool.query(
          'SELECT airport_name, city, state FROM airport_icao WHERE icao_code = $1',
          [icao]
        );

        if (airportCheck.rows.length > 0) {
          const airport = airportCheck.rows[0];
          return NextResponse.json({
            success: false,
            message: `Não há hangares disponíveis em ${airport.airport_name} (${airport.city}/${airport.state}) no momento.`,
            suggestion: 'Tente buscar em aeródromos próximos ou cadastre-se como proprietário para anunciar seu hangar.',
            icao: icao,
            location: `${airport.city}/${airport.state}`,
            hangars: []
          });
        }
      }

      return NextResponse.json({
        success: false,
        message: city 
          ? `Não há hangares disponíveis em "${city}" no momento.`
          : `Não há hangares disponíveis no aeródromo ${icao} no momento.`,
        suggestion: 'Tente buscar em outras localidades ou cadastre-se como proprietário para anunciar seu hangar.',
        hangars: []
      });
    }

    // Formatar dados dos hangares
    const hangars = result.rows.map((row: any) => ({
      id: row.id,
      icaoCode: row.icao_code,
      aerodromeName: row.aerodrome_name,
      city: row.city,
      state: row.state,
      country: row.country,
      hangarNumber: row.hangar_number,
      locationDescription: row.hangar_location_description,
      sizeSqm: row.hangar_size_sqm,
      maxWingspan: row.max_wingspan_meters,
      maxLength: row.max_length_meters,
      maxHeight: row.max_height_meters,
      acceptedCategories: row.accepted_aircraft_categories,
      pricing: {
        hourly: row.hourly_rate,
        daily: row.daily_rate,
        weekly: row.weekly_rate,
        monthly: row.monthly_rate,
      },
      availability: {
        from: row.available_from,
        until: row.available_until,
        isAvailable: row.is_available,
      },
      operatingHours: row.operating_hours,
      services: row.services,
      description: row.description,
      specialNotes: row.special_notes,
      paymentOptions: {
        online: row.accepts_online_payment,
        onArrival: row.accepts_payment_on_arrival,
        onDeparture: row.accepts_payment_on_departure,
      },
      cancellationPolicy: row.cancellation_policy,
      verificationStatus: row.verification_status,
      photos: row.photos,
      owner: {
        firstName: row.owner_first_name,
        lastName: row.owner_last_name,
      }
    }));

    return NextResponse.json({
      success: true,
      message: `${hangars.length} hangar(es) encontrado(s)`,
      count: hangars.length,
      hangars: hangars
    });

  } catch (error) {
    console.error('Erro ao buscar hangares:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao buscar hangares no banco de dados',
        message: 'Tente novamente em alguns instantes.' 
      },
      { status: 500 }
    );
  }
}
