import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

/**
 * GET /api/hangarshare/coupons
 * List all active promo codes for HangarShare
 * Query params: limit, offset, search
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get('limit') || 50), 500);
    const offset = Number(searchParams.get('offset') || 0);
    const search = searchParams.get('search') || '';

    let query = `
      SELECT 
        id, code, description, discount_type, discount_value,
        max_uses, used_count, valid_from, valid_until, is_active,
        created_at, updated_at
      FROM coupons
      WHERE is_active = TRUE
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (code ILIKE $${params.length + 1} OR description ILIKE $${params.length + 2})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      data: {
        coupons: result.rows,
        count: result.rows.length,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar coupons' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hangarshare/coupons
 * Create a new promo code (admin only)
 * Body: { code, description, discount_type, discount_value, max_uses, valid_until }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const auth = await verifyToken(request.headers.get('authorization') || '');
    if (!auth || !['admin', 'master'].includes(auth.role || '')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      code,
      description,
      discount_type, // 'percent' or 'fixed'
      discount_value,
      max_uses,
      valid_until,
    } = body;

    // Validation
    if (!code || !discount_type || discount_value === null) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios faltando' },
        { status: 400 }
      );
    }

    if (!['percent', 'fixed', 'free_booking'].includes(discount_type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de desconto inválido' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await pool.query(
      'SELECT id FROM coupons WHERE code = $1',
      [code.toUpperCase()]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Código já existe' },
        { status: 409 }
      );
    }

    const result = await pool.query(
      `INSERT INTO coupons 
        (code, description, discount_type, discount_value, max_uses, valid_until, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)
       RETURNING id, code, discount_type, discount_value, max_uses, valid_until, is_active, created_at`,
      [code.toUpperCase(), description, discount_type, discount_value, max_uses || null, valid_until || null, auth!.id]
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          coupon: result.rows[0],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar coupon' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/hangarshare/coupons/[id]
 * Update a promo code (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify admin token
    const auth = await verifyToken(request.headers.get('authorization') || '');
    if (!auth || !['admin', 'master'].includes(auth.role || '')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, description, discount_value, max_uses, valid_until, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (discount_value !== undefined) {
      updates.push(`discount_value = $${paramCount++}`);
      values.push(discount_value);
    }
    if (max_uses !== undefined) {
      updates.push(`max_uses = $${paramCount++}`);
      values.push(max_uses);
    }
    if (valid_until !== undefined) {
      updates.push(`valid_until = $${paramCount++}`);
      values.push(valid_until);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE coupons SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        coupon: result.rows[0],
      },
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar coupon' },
      { status: 500 }
    );
  }
}
