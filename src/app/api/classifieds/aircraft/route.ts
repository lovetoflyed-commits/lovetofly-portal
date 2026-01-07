import { NextResponse } from 'next/server';
import pool from '@/config/db';

// POST - Create new aircraft listing
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      user_id,
      title,
      manufacturer,
      model,
      year,
      registration,
      serial_number,
      category,
      total_time,
      engine_time,
      price,
      location_city,
      location_state,
      location_country = 'BR',
      description,
      avionics,
      interior_condition,
      exterior_condition,
      logs_status,
      damage_history = false,
      financing_available = false,
      partnership_available = false,
      status = 'draft'
    } = body;

    // Validation
    if (!user_id || !title || !manufacturer || !model || !year || !price || !location_city || !location_state || !category) {
      return NextResponse.json(
        { message: 'Campos obrigatórios: user_id, title, manufacturer, model, year, price, location_city, location_state, category' },
        { status: 400 }
      );
    }

    // Set expiration date (30 days from now)
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 30);

    const result = await pool.query(
      `INSERT INTO aircraft_listings (
        user_id, title, manufacturer, model, year, registration, serial_number, category,
        total_time, engine_time, price, location_city, location_state, location_country,
        description, avionics, interior_condition, exterior_condition, logs_status,
        damage_history, financing_available, partnership_available, status, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *`,
      [
        user_id, title, manufacturer, model, year, registration, serial_number, category,
        total_time, engine_time, price, location_city, location_state, location_country,
        description, avionics, interior_condition, exterior_condition, logs_status,
        damage_history, financing_available, partnership_available, status, expires_at
      ]
    );

    return NextResponse.json({ data: result.rows[0], message: 'Anúncio criado com sucesso!' }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar anúncio de aeronave:', error);
    return NextResponse.json({ message: 'Erro ao criar anúncio' }, { status: 500 });
  }
}

// GET - Search/list aircraft listings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const min_price = searchParams.get('min_price');
    const max_price = searchParams.get('max_price');
    const state = searchParams.get('state');
    const manufacturer = searchParams.get('manufacturer');
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

    if (manufacturer) {
      queryConditions.push(`manufacturer ILIKE $${paramIndex}`);
      queryParams.push(`%${manufacturer}%`);
      paramIndex++;
    }

    if (featured === 'true') {
      queryConditions.push('featured = true AND featured_until > NOW()');
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM aircraft_listings ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get listings with user info
    queryParams.push(limit, offset);
    const result = await pool.query(
      `SELECT 
        a.*,
          CONCAT(u.first_name, ' ', u.last_name) as seller_name,
        u.email as seller_email,
        (SELECT COUNT(*) FROM listing_photos WHERE listing_type = 'aircraft' AND listing_id = a.id) as photo_count,
        (SELECT url FROM listing_photos WHERE listing_type = 'aircraft' AND listing_id = a.id AND is_primary = true LIMIT 1) as primary_photo
      FROM aircraft_listings a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY featured DESC, created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    );

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
    console.error('Erro ao buscar anúncios de aeronaves:', error);
    return NextResponse.json({ message: 'Erro ao buscar anúncios' }, { status: 500 });
  }
}
