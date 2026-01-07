import { NextResponse } from 'next/server';
import pool from '@/config/db';

// POST - Create new avionics listing
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      user_id,
      title,
      manufacturer,
      model,
      category,
      condition,
      software_version,
      tso_certified = false,
      panel_mount = true,
      price,
      location_city,
      location_state,
      description,
      compatible_aircraft,
      includes_installation = false,
      warranty_remaining,
      status = 'active'
    } = body;

    // Validation
    if (!user_id || !title || !manufacturer || !model || !category || !condition || !price || !location_city || !location_state) {
      return NextResponse.json(
        { message: 'Campos obrigatórios: user_id, title, manufacturer, model, category, condition, price, location_city, location_state' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO avionics_listings (
        user_id, title, manufacturer, model, category, condition, software_version,
        tso_certified, panel_mount, price, location_city, location_state, description,
        compatible_aircraft, includes_installation, warranty_remaining, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        user_id, title, manufacturer, model, category, condition, software_version,
        tso_certified, panel_mount, price, location_city, location_state, description,
        compatible_aircraft, includes_installation, warranty_remaining, status
      ]
    );

    return NextResponse.json({ data: result.rows[0], message: 'Anúncio de aviônico criado com sucesso!' }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar anúncio de aviônico:', error);
    return NextResponse.json({ message: 'Erro ao criar anúncio' }, { status: 500 });
  }
}

// GET - Search/list avionics listings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');
    const min_price = searchParams.get('min_price');
    const max_price = searchParams.get('max_price');
    const state = searchParams.get('state');
    const manufacturer = searchParams.get('manufacturer');
    const tso_certified = searchParams.get('tso_certified');
    const panel_mount = searchParams.get('panel_mount');
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

    if (manufacturer) {
      queryConditions.push(`manufacturer ILIKE $${paramIndex}`);
      queryParams.push(`%${manufacturer}%`);
      paramIndex++;
    }

    if (tso_certified === 'true') {
      queryConditions.push('tso_certified = true');
    }

    if (panel_mount === 'true') {
      queryConditions.push('panel_mount = true');
    } else if (panel_mount === 'false') {
      queryConditions.push('panel_mount = false');
    }

    if (featured === 'true') {
      queryConditions.push('featured = true');
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM avionics_listings ${whereClause}`,
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
        (SELECT COUNT(*) FROM listing_photos WHERE listing_type = 'avionics' AND listing_id = a.id) as photo_count,
        (SELECT url FROM listing_photos WHERE listing_type = 'avionics' AND listing_id = a.id AND is_primary = true LIMIT 1) as primary_photo
      FROM avionics_listings a
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
    console.error('Erro ao buscar anúncios de aviônicos:', error);
    return NextResponse.json({ message: 'Erro ao buscar anúncios' }, { status: 500 });
  }
}
