import { NextResponse } from 'next/server';
import pool from '@/config/db';

// GET - Get single avionics listing detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Mock data for homepage featured avionics
    const mockAvionics: Record<string, any> = {
      'garmin-gtn-750xi-demo': {
        id: 'garmin-gtn-750xi-demo',
        title: 'Garmin GTN 750Xi (TSO)',
        equipment_name: 'Garmin GTN 750Xi',
        manufacturer: 'Garmin',
        model: 'GTN 750Xi',
        part_number: '011-03738-65',
        condition: 'Novo',
        price: 185000,
        currency: 'BRL',
        quantity: 1,
        location: 'São Paulo, SP',
        description: 'GPS/NAV/COM touchscreen com certificação TSO. Display de 7 polegadas, integração completa com sistemas de aeronave. Inclui banco de dados mundial de navegação atualizado. Interface intuitiva, suporte para cartas Jeppesen. Instalação profissional disponível.',
        compatible_models: 'Certificado para instalação em aeronaves IFR',
        tso_certified: true,
        warranty_months: 24,
        seller_name: 'Avionics Pro Brasil',
        seller_phone: '+55 (11) 99876-5432',
        seller_email: 'vendas@avionicspro.com.br',
        photos: [{ id: 1, photo_url: '/classifieds/avionics-featured.jpg', is_primary: true }],
        status: 'active',
        created_at: new Date().toISOString(),
      },
    };

    // Check if this is a demo avionics
    if (mockAvionics[id]) {
      return NextResponse.json({ data: mockAvionics[id] }, { status: 200 });
    }

    // Increment view count
    await pool.query(
      'UPDATE avionics_listings SET views = views + 1 WHERE id = $1',
      [id]
    );

    // Get listing with seller info and photos
    const result = await pool.query(
      `SELECT 
        a.*,
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
      FROM avionics_listings a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN listing_photos ph ON ph.listing_type = 'avionics' AND ph.listing_id = a.id
      WHERE a.id = $1
      GROUP BY a.id, u.name, u.email, u.phone`,
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

// PUT - Update avionics listing
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      title, manufacturer, model, category, condition, software_version,
      tso_certified, panel_mount, price, location_city, location_state,
      description, compatible_aircraft, includes_installation, warranty_remaining, status
    } = body;

    const result = await pool.query(
      `UPDATE avionics_listings SET
        title = COALESCE($1, title),
        manufacturer = COALESCE($2, manufacturer),
        model = COALESCE($3, model),
        category = COALESCE($4, category),
        condition = COALESCE($5, condition),
        software_version = COALESCE($6, software_version),
        tso_certified = COALESCE($7, tso_certified),
        panel_mount = COALESCE($8, panel_mount),
        price = COALESCE($9, price),
        location_city = COALESCE($10, location_city),
        location_state = COALESCE($11, location_state),
        description = COALESCE($12, description),
        compatible_aircraft = COALESCE($13, compatible_aircraft),
        includes_installation = COALESCE($14, includes_installation),
        warranty_remaining = COALESCE($15, warranty_remaining),
        status = COALESCE($16, status),
        updated_at = NOW()
      WHERE id = $17
      RETURNING *`,
      [
        title, manufacturer, model, category, condition, software_version,
        tso_certified, panel_mount, price, location_city, location_state,
        description, compatible_aircraft, includes_installation, warranty_remaining, status, id
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

// DELETE - Delete avionics listing
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete associated photos first
    await pool.query(
      `DELETE FROM listing_photos WHERE listing_type = 'avionics' AND listing_id = $1`,
      [id]
    );

    // Delete listing
    const result = await pool.query(
      'DELETE FROM avionics_listings WHERE id = $1 RETURNING *',
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
