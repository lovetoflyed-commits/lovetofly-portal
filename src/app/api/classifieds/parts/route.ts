import { NextResponse } from 'next/server';
import pool from '@/config/db';

// POST - Create new parts listing
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      user_id,
      title,
      part_number,
      manufacturer,
      category,
      condition,
      time_since_overhaul,
      price,
      location_city,
      location_state,
      description,
      compatible_aircraft,
      has_certification = false,
      has_logbook = false,
      shipping_available = true,
      return_policy,
      status = 'active'
    } = body;

    // Validation
    if (!user_id || !title || !category || !condition || !price || !location_city || !location_state) {
      return NextResponse.json(
        { message: 'Campos obrigatórios: user_id, title, category, condition, price, location_city, location_state' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO parts_listings (
        user_id, title, part_number, manufacturer, category, condition, time_since_overhaul,
        price, location_city, location_state, description, compatible_aircraft,
        has_certification, has_logbook, shipping_available, return_policy, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        user_id, title, part_number, manufacturer, category, condition, time_since_overhaul,
        price, location_city, location_state, description, compatible_aircraft,
        has_certification, has_logbook, shipping_available, return_policy, status
      ]
    );

    return NextResponse.json({ data: result.rows[0], message: 'Anúncio de peça criado com sucesso!' }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar anúncio de peça:', error);
    return NextResponse.json({ message: 'Erro ao criar anúncio' }, { status: 500 });
  }
}

// GET - Search/list parts listings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');
    const min_price = searchParams.get('min_price');
    const max_price = searchParams.get('max_price');
    const state = searchParams.get('state');
    const part_number = searchParams.get('part_number');
    const manufacturer = searchParams.get('manufacturer');
    const has_certification = searchParams.get('has_certification');
    const featured = searchParams.get('featured');
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let queryConditions = ['status = $1'];
    let queryParams: any[] = [status];
    let paramIndex = 2;

    if (category) {
      queryConditions.push(`category = $${paramIndex}`);
      queryParams.push(category);
      paramIndex++;
    }

    if (condition) {
      queryConditions.push(`condition = $${paramIndex}`);
      queryParams.push(condition);
      paramIndex++;
    }

    if (min_price) {
      queryConditions.push(`price >= $${paramIndex}`);
      queryParams.push(parseFloat(min_price));
      paramIndex++;
    }

    if (max_price) {
      queryConditions.push(`price <= $${paramIndex}`);
      queryParams.push(parseFloat(max_price));
      paramIndex++;
    }

    if (state) {
      queryConditions.push(`location_state = $${paramIndex}`);
      queryParams.push(state);
      paramIndex++;
    }

    if (part_number) {
      queryConditions.push(`part_number ILIKE $${paramIndex}`);
      queryParams.push(`%${part_number}%`);
      paramIndex++;
    }

    if (manufacturer) {
      queryConditions.push(`manufacturer ILIKE $${paramIndex}`);
      queryParams.push(`%${manufacturer}%`);
      paramIndex++;
    }

    if (has_certification === 'true') {
      queryConditions.push('has_certification = true');
    }

    if (featured === 'true') {
      queryConditions.push('featured = true');
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

    // Get listings with user info and total count in one query
    queryParams.push(limit, offset);
    const result = await pool.query(
      `SELECT 
        p.*,
        CONCAT(u.first_name, ' ', u.last_name) as seller_name,
        u.email as seller_email,
        (SELECT COUNT(*) FROM listing_photos WHERE listing_type = 'parts' AND listing_id = p.id) as photo_count,
        (SELECT url FROM listing_photos WHERE listing_type = 'parts' AND listing_id = p.id AND is_primary = true LIMIT 1) as primary_photo,
        COUNT(*) OVER () as total_count
      FROM parts_listings p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY featured DESC, created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    );

    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

    return NextResponse.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar anúncios de peças:', error);
    return NextResponse.json({ message: 'Erro ao buscar anúncios' }, { status: 500 });
  }
}
