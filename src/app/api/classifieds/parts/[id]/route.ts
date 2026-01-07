import { NextResponse } from 'next/server';
import pool from '@/config/db';

// GET - Get single parts listing detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Mock data for homepage featured parts
    const mockParts: Record<string, any> = {
      'lycoming-io360-overhaul-demo': {
        id: 'lycoming-io360-overhaul-demo',
        title: 'Motor Lycoming IO-360 Overhaul',
        part_name: 'Motor Lycoming IO-360',
        manufacturer: 'Lycoming',
        part_number: 'IO-360-L2A',
        condition: 'Overhauled',
        price: 142000,
        currency: 'BRL',
        quantity: 1,
        location: 'Curitiba, PR',
        description: 'Motor Lycoming IO-360 recém revisado (overhaul) com zero horas desde a revisão. Todas as peças inspecionadas e substituídas conforme necessário. Certificado de revisão ANAC incluso. Garantia de 12 meses. Pronto para instalação.',
        compatible_models: 'Cessna 172, Piper Cherokee, Grumman AA-5',
        serial_number: 'L-12345-48A',
        tbo_hours: 2000,
        seller_name: 'Aeromotores Brasil',
        seller_phone: '+55 (41) 98765-4321',
        seller_email: 'vendas@aeromotores.com.br',
        photos: [{ id: 1, photo_url: '/classifieds/parts-featured.jpg', is_primary: true }],
        status: 'active',
        created_at: new Date().toISOString(),
      },
    };

    // Check if this is a demo part
    if (mockParts[id]) {
      return NextResponse.json({ data: mockParts[id] }, { status: 200 });
    }

    // Increment view count
    await pool.query(
      'UPDATE parts_listings SET views = views + 1 WHERE id = $1',
      [id]
    );

    // Get listing with seller info and photos
    const result = await pool.query(
      `SELECT 
        p.*,
        u.name as seller_name,
        u.email as seller_email,
        u.phone as seller_phone,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ph.id,
              'url', ph.url,
              'thumbnail_url', ph.thumbnail_url,
              'display_order', ph.display_order,
              'is_primary', ph.is_primary
            ) ORDER BY ph.display_order, ph.is_primary DESC
          ) FILTER (WHERE ph.id IS NOT NULL),
          '[]'
        ) as photos
      FROM parts_listings p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN listing_photos ph ON ph.listing_type = 'parts' AND ph.listing_id = p.id
      WHERE p.id = $1
      GROUP BY p.id, u.name, u.email, u.phone`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Anúncio não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar detalhes do anúncio:', error);
    return NextResponse.json({ message: 'Erro ao buscar detalhes' }, { status: 500 });
  }
}

// PUT - Update parts listing
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      title, part_number, manufacturer, category, condition, time_since_overhaul,
      price, location_city, location_state, description, compatible_aircraft,
      has_certification, has_logbook, shipping_available, return_policy, status
    } = body;

    const result = await pool.query(
      `UPDATE parts_listings SET
        title = COALESCE($1, title),
        part_number = COALESCE($2, part_number),
        manufacturer = COALESCE($3, manufacturer),
        category = COALESCE($4, category),
        condition = COALESCE($5, condition),
        time_since_overhaul = COALESCE($6, time_since_overhaul),
        price = COALESCE($7, price),
        location_city = COALESCE($8, location_city),
        location_state = COALESCE($9, location_state),
        description = COALESCE($10, description),
        compatible_aircraft = COALESCE($11, compatible_aircraft),
        has_certification = COALESCE($12, has_certification),
        has_logbook = COALESCE($13, has_logbook),
        shipping_available = COALESCE($14, shipping_available),
        return_policy = COALESCE($15, return_policy),
        status = COALESCE($16, status),
        updated_at = NOW()
      WHERE id = $17
      RETURNING *`,
      [
        title, part_number, manufacturer, category, condition, time_since_overhaul,
        price, location_city, location_state, description, compatible_aircraft,
        has_certification, has_logbook, shipping_available, return_policy, status, id
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Anúncio não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0], message: 'Anúncio atualizado com sucesso!' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar anúncio:', error);
    return NextResponse.json({ message: 'Erro ao atualizar anúncio' }, { status: 500 });
  }
}

// DELETE - Delete parts listing
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete associated photos first
    await pool.query(
      `DELETE FROM listing_photos WHERE listing_type = 'parts' AND listing_id = $1`,
      [id]
    );

    // Delete listing
    const result = await pool.query(
      'DELETE FROM parts_listings WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Anúncio não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Anúncio excluído com sucesso!' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao excluir anúncio:', error);
    return NextResponse.json({ message: 'Erro ao excluir anúncio' }, { status: 500 });
  }
}
