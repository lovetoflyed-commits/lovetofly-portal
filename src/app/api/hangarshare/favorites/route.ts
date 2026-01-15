import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import pool from '@/config/db';
import MonitoringService from '@/services/monitoring';

/**
 * GET /api/hangarshare/favorites
 * Get all favorite listings for the authenticated user
 */
export async function GET(request: Request) {
  const startTime = performance.now();
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Get user's favorites with listing details and aggregated booking count (no N+1)
    const result = await pool.query(
      `SELECT 
        f.id as favorite_id,
        f.created_at as favorited_at,
        hl.id as listing_id,
        hl.hangar_number,
        hl.icao_code,
        hl.description,
        hl.monthly_rate,
        hl.daily_rate,
        hl.hangar_size_sqm as size_sqm,
        hl.max_wingspan_meters as max_wingspan,
        hl.max_length_meters as max_length,
        hl.max_height_meters as max_height,
        hl.security_features,
        hl.services,
        hl.created_at as listing_created_at,
        hl.updated_at as listing_updated_at,
        ai.name as airport_name,
        ai.city,
        ai.state,
        COALESCE(booking_counts.total_bookings, 0)::int as total_bookings
       FROM hangar_favorites f
       INNER JOIN hangar_listings hl ON f.listing_id = hl.id
       LEFT JOIN airport_icao ai ON hl.icao_code = ai.icao_code
       LEFT JOIN (
         SELECT hangar_id, COUNT(*) as total_bookings
         FROM hangar_bookings
         GROUP BY hangar_id
       ) booking_counts ON hl.id = booking_counts.hangar_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [decoded.id]
    );

    const duration = performance.now() - startTime;
    MonitoringService.trackApiPerformance(
      '/api/hangarshare/favorites',
      duration,
      200
    );

    return NextResponse.json({
      favorites: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    MonitoringService.trackApiPerformance(
      '/api/hangarshare/favorites',
      duration,
      500,
      false
    );
    MonitoringService.captureException(error as Error, { endpoint: '/api/hangarshare/favorites' });
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar favoritos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hangarshare/favorites
 * Add a listing to favorites
 */
export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Get listing_id from request body
    const body = await request.json();
    const { listing_id } = body;

    if (!listing_id) {
      return NextResponse.json(
        { message: 'ID do anúncio é obrigatório' },
        { status: 400 }
      );
    }

    // Verify listing exists
    const listingCheck = await pool.query(
      'SELECT id FROM hangar_listings WHERE id = $1',
      [listing_id]
    );

    if (listingCheck.rows.length === 0) {
      return NextResponse.json(
        { message: 'Anúncio não encontrado' },
        { status: 404 }
      );
    }

    // Add to favorites (ON CONFLICT DO NOTHING handles duplicates)
    const result = await pool.query(
      `INSERT INTO hangar_favorites (user_id, listing_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, listing_id) DO NOTHING
       RETURNING id, created_at`,
      [decoded.id, listing_id]
    );

    if (result.rows.length === 0) {
      // Already in favorites
      return NextResponse.json(
        { message: 'Anúncio já está nos favoritos', alreadyFavorited: true },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: 'Anúncio adicionado aos favoritos',
        favorite: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { message: 'Erro ao adicionar favorito' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/hangarshare/favorites
 * Remove a listing from favorites
 */
export async function DELETE(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Get listing_id from request body
    const body = await request.json();
    const { listing_id } = body;

    if (!listing_id) {
      return NextResponse.json(
        { message: 'ID do anúncio é obrigatório' },
        { status: 400 }
      );
    }

    // Remove from favorites
    const result = await pool.query(
      `DELETE FROM hangar_favorites
       WHERE user_id = $1 AND listing_id = $2
       RETURNING id`,
      [decoded.id, listing_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Favorito não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Anúncio removido dos favoritos',
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { message: 'Erro ao remover favorito' },
      { status: 500 }
    );
  }
}
