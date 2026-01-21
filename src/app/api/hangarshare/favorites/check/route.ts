import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import pool from '@/config/db';

/**
 * GET /api/hangarshare/favorites/check?listing_id=xxx
 * Check if a listing is in the user's favorites
 */
export async function GET(request: NextRequest) {
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

    // Get listing_id from query params
    const { searchParams } = new URL(request.url);
    const listing_id = searchParams.get('listing_id');

    if (!listing_id) {
      return NextResponse.json(
        { message: 'ID do anúncio é obrigatório' },
        { status: 400 }
      );
    }

    // Check if favorited
    const result = await pool.query(
      `SELECT id, created_at 
       FROM hangar_favorites
       WHERE user_id = $1 AND listing_id = $2`,
      [decoded.id, listing_id]
    );

    return NextResponse.json({
      isFavorited: result.rows.length > 0,
      favorite: result.rows[0] || null,
    });
  } catch (error) {
    console.error('Error checking favorite:', error);
    return NextResponse.json(
      { message: 'Erro ao verificar favorito' },
      { status: 500 }
    );
  }
}
