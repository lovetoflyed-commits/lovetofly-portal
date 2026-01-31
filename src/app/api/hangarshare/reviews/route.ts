import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import pool from '@/config/db';
import MonitoringService from '@/services/monitoring';

async function updateOwnerScore(ownerUserId: number) {
  const statsRes = await pool.query(
    `SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS total_reviews
     FROM hangar_reviews
     WHERE owner_user_id = $1`,
    [ownerUserId]
  );

  const avgRating = Number(statsRes.rows[0]?.avg_rating || 0);
  const totalReviews = Number(statsRes.rows[0]?.total_reviews || 0);

  await pool.query(
    `UPDATE users
     SET hangar_owner_rating = $1, hangar_owner_reviews_count = $2
     WHERE id = $3`,
    [avgRating, totalReviews, ownerUserId]
  );
}

/**
 * GET /api/hangarshare/reviews
 * Get all reviews for a specific listing
 * Query params: listing_id (required), page, limit, sort_by
 */
export async function GET(request: Request) {
  const startTime = performance.now();
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listing_id');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'));
    const sortBy = searchParams.get('sort_by') || 'recent'; // recent, helpful, rating_high, rating_low
    
    if (!listingId) {
      return NextResponse.json(
        { message: 'listing_id é obrigatório' },
        { status: 400 }
      );
    }

    // Determine sorting order
    let orderClause = 'hr.created_at DESC';
    if (sortBy === 'rating_high') {
      orderClause = 'hr.rating DESC, hr.created_at DESC';
    } else if (sortBy === 'rating_low') {
      orderClause = 'hr.rating ASC, hr.created_at DESC';
    } else if (sortBy === 'helpful') {
      orderClause = 'hr.created_at DESC'; // TODO: Add helpful votes table
    }

    const offset = (page - 1) * limit;

    // Get reviews, count, and stats in single query with window functions (optimized)
    const result = await pool.query(
      `SELECT 
        -- Review data
        hr.id,
        hr.rating,
        hr.comment,
        hr.created_at,
        hr.updated_at,
        hr.reviewer_user_id as user_id,
        TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) as user_name,
        u.email as user_email,
        -- Pagination metadata
        COUNT(*) OVER () as total_reviews,
        -- Stats (same for all rows in result set)
        COUNT(*) OVER () as stats_total_reviews,
        ROUND(AVG(hr.rating) OVER ()::numeric, 1) as stats_avg_rating,
        COUNT(CASE WHEN hr.rating = 5 THEN 1 END) OVER () as stats_rating_5_count,
        COUNT(CASE WHEN hr.rating = 4 THEN 1 END) OVER () as stats_rating_4_count,
        COUNT(CASE WHEN hr.rating = 3 THEN 1 END) OVER () as stats_rating_3_count,
        COUNT(CASE WHEN hr.rating = 2 THEN 1 END) OVER () as stats_rating_2_count,
        COUNT(CASE WHEN hr.rating = 1 THEN 1 END) OVER () as stats_rating_1_count
       FROM hangar_reviews hr
       INNER JOIN users u ON hr.reviewer_user_id = u.id
       WHERE hr.listing_id = $1
       ORDER BY ${orderClause}
       LIMIT $2 OFFSET $3`,
      [listingId, limit, offset]
    );

    // Extract stats from first row (all rows have same values)
    const statsRow = result.rows[0];
    const stats = statsRow ? {
      total_reviews: parseInt(statsRow.stats_total_reviews),
      avg_rating: parseFloat(statsRow.stats_avg_rating) || 0,
      rating_5_count: parseInt(statsRow.stats_rating_5_count),
      rating_4_count: parseInt(statsRow.stats_rating_4_count),
      rating_3_count: parseInt(statsRow.stats_rating_3_count),
      rating_2_count: parseInt(statsRow.stats_rating_2_count),
      rating_1_count: parseInt(statsRow.stats_rating_1_count)
    } : {
      total_reviews: 0,
      avg_rating: 0,
      rating_5_count: 0,
      rating_4_count: 0,
      rating_3_count: 0,
      rating_2_count: 0,
      rating_1_count: 0
    };

    // Remove stats columns from review rows for cleaner API response
    const reviews = result.rows.map(row => ({
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_id: row.user_id,
      user_name: row.user_name,
      user_email: row.user_email
    }));

    const duration = performance.now() - startTime;
    MonitoringService.trackApiPerformance(
      '/api/hangarshare/reviews',
      duration,
      200
    );

    return NextResponse.json({
      reviews,
      stats,
      pagination: {
        page,
        limit,
        total: parseInt(statsRow?.total_reviews || '0'),
        pages: Math.ceil(parseInt(statsRow?.total_reviews || '0') / limit)
      }
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    MonitoringService.trackApiPerformance(
      '/api/hangarshare/reviews',
      duration,
      500,
      false
    );
    MonitoringService.captureException(error as Error, { endpoint: '/api/hangarshare/reviews' });
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar avaliações' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hangarshare/reviews
 * Submit a new review for a listing
 * Requires: listing_id, rating, comment (optional)
 */
export async function POST(request: Request) {
  try {
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

    const body = await request.json();
    const { listing_id, rating, comment } = body;

    // Validate input
    if (!listing_id || !rating) {
      return NextResponse.json(
        { message: 'listing_id e rating são obrigatórios' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'Rating deve estar entre 1 e 5' },
        { status: 400 }
      );
    }

    if (comment && (comment.length < 10 || comment.length > 500)) {
      return NextResponse.json(
        { message: 'Comentário deve ter entre 10 e 500 caracteres' },
        { status: 400 }
      );
    }

    const listingResult = await pool.query(
      'SELECT id, user_id FROM hangar_listings WHERE id = $1',
      [listing_id]
    );

    if (listingResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Hangar não encontrado' },
        { status: 404 }
      );
    }

    const listing = listingResult.rows[0];

    // Check if user has booked this listing
    const bookingCheck = await pool.query(
      `SELECT id FROM hangar_bookings 
       WHERE hangar_id = $1 AND user_id = $2 AND status IN ('confirmed', 'completed')
       ORDER BY created_at DESC
       LIMIT 1`,
      [listing_id, decoded.id]
    );

    if (bookingCheck.rows.length === 0) {
      return NextResponse.json(
        { message: 'Você só pode avaliar hangares que já reservou' },
        { status: 403 }
      );
    }

    // Check if user already reviewed this listing
    const existingReview = await pool.query(
      'SELECT id FROM hangar_reviews WHERE listing_id = $1 AND reviewer_user_id = $2',
      [listing_id, decoded.id]
    );

    if (existingReview.rows.length > 0) {
      return NextResponse.json(
        { message: 'Você já avaliou este hangar. Use PATCH para atualizar.' },
        { status: 409 }
      );
    }

    // Insert review
    const result = await pool.query(
      `INSERT INTO hangar_reviews (
        listing_id,
        reviewer_user_id,
        owner_user_id,
        booking_id,
        rating,
        comment,
        is_verified
       ) VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING id`,
      [listing_id, decoded.id, listing.user_id, bookingCheck.rows[0].id, rating, comment || null]
    );

    await updateOwnerScore(Number(listing.user_id));

    const reviewRes = await pool.query(
      `SELECT r.*, 
              r.reviewer_user_id as user_id,
              TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) as user_name
       FROM hangar_reviews r
       JOIN users u ON u.id = r.reviewer_user_id
       WHERE r.id = $1`,
      [result.rows[0].id]
    );

    return NextResponse.json(
      { review: reviewRes.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { message: 'Erro ao criar avaliação' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/hangarshare/reviews/[id]
 * Update an existing review (only own reviews)
 */
export async function PATCH(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');
    
    if (!reviewId) {
      return NextResponse.json(
        { message: 'review id é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { rating, comment } = body;

    // Verify ownership
    const reviewCheck = await pool.query(
      'SELECT reviewer_user_id, owner_user_id FROM hangar_reviews WHERE id = $1',
      [reviewId]
    );

    if (reviewCheck.rows.length === 0) {
      return NextResponse.json(
        { message: 'Avaliação não encontrada' },
        { status: 404 }
      );
    }

    const isAdmin = ['admin', 'master', 'staff'].includes(String(decoded.role || '').toLowerCase());

    if (reviewCheck.rows[0].reviewer_user_id !== decoded.id && !isAdmin) {
      return NextResponse.json(
        { message: 'Você só pode editar suas próprias avaliações' },
        { status: 403 }
      );
    }

    // Validate input
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { message: 'Rating deve estar entre 1 e 5' },
        { status: 400 }
      );
    }

    if (comment && (comment.length < 10 || comment.length > 500)) {
      return NextResponse.json(
        { message: 'Comentário deve ter entre 10 e 500 caracteres' },
        { status: 400 }
      );
    }

    // Update review
    const updateQuery = rating && comment 
      ? 'rating = $1, comment = $2'
      : rating ? 'rating = $1'
      : 'comment = $2';
    
    const params = rating && comment 
      ? [rating, comment, reviewId]
      : rating ? [rating, reviewId]
      : [comment, reviewId];

    const result = await pool.query(
      `UPDATE hangar_reviews 
       SET ${updateQuery}, updated_at = NOW()
       WHERE id = $${params.length}
       RETURNING *`,
      params
    );

    await updateOwnerScore(Number(reviewCheck.rows[0].owner_user_id));

    const reviewRes = await pool.query(
      `SELECT r.*, 
              r.reviewer_user_id as user_id,
              TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) as user_name
       FROM hangar_reviews r
       JOIN users u ON u.id = r.reviewer_user_id
       WHERE r.id = $1`,
      [result.rows[0].id]
    );

    return NextResponse.json({ review: reviewRes.rows[0] });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar avaliação' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/hangarshare/reviews/[id]
 * Delete a review (only own reviews)
 */
export async function DELETE(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');
    
    if (!reviewId) {
      return NextResponse.json(
        { message: 'review id é obrigatório' },
        { status: 400 }
      );
    }

    // Verify ownership
    const reviewCheck = await pool.query(
      'SELECT reviewer_user_id, owner_user_id FROM hangar_reviews WHERE id = $1',
      [reviewId]
    );

    if (reviewCheck.rows.length === 0) {
      return NextResponse.json(
        { message: 'Avaliação não encontrada' },
        { status: 404 }
      );
    }

    const isAdmin = ['admin', 'master', 'staff'].includes(String(decoded.role || '').toLowerCase());

    if (reviewCheck.rows[0].reviewer_user_id !== decoded.id && !isAdmin) {
      return NextResponse.json(
        { message: 'Você só pode deletar suas próprias avaliações' },
        { status: 403 }
      );
    }

    // Delete review
    await pool.query(
      'DELETE FROM hangar_reviews WHERE id = $1',
      [reviewId]
    );

    await updateOwnerScore(Number(reviewCheck.rows[0].owner_user_id));

    return NextResponse.json(
      { message: 'Avaliação deletada com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { message: 'Erro ao deletar avaliação' },
      { status: 500 }
    );
  }
}
