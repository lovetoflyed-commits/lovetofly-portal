import { NextResponse } from 'next/server';
import pool from '@/config/db';

// GET - Get single aircraft listing detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Mock data for homepage carousel demo aircraft
    const mockAircraft: Record<string, any> = {
      'cirrus-sr22t-g6-demo': {
        id: 'cirrus-sr22t-g6-demo',
        title: 'Cirrus SR22T G6',
        manufacturer: 'Cirrus',
        model: 'SR22T G6',
        year: 2022,
        category: 'Monomotor Pistão',
        price: 4250000,
        currency: 'BRL',
        total_time: 450,
        location: 'Jundiaí, SP',
        description: 'Cirrus SR22T G6 2022 em estado impecável. Equipado com sistema de paraquedas balístico CAPS, aviônicos Garmin Perspective+ com telas touchscreen, motor turbo Continental TSIO-550-K. Interior em couro premium, ar condicionado, sistema anti-gelo. Manutenção em dia com histórico completo. Aeronave ideal para viagens executivas e cross-country de alta performance.',
        seller_name: 'Premium Aviation',
        seller_phone: '+55 (11) 98765-4321',
        seller_email: 'vendas@premiumaviation.com.br',
        photos: [{ id: 1, photo_url: '/classifieds/aircraft-featured.jpg', is_primary: true }],
        status: 'active',
        created_at: new Date().toISOString(),
      },
      'cessna-172s-2015-demo': {
        id: 'cessna-172s-2015-demo',
        title: '2015 CESSNA 172S SKYHAWK',
        manufacturer: 'Cessna',
        model: '172S Skyhawk',
        year: 2015,
        category: 'Monomotor Pistão',
        price: 285000,
        currency: 'USD',
        total_time: 2150,
        location: 'São Paulo, Brasil',
        description: 'Excelente Cessna 172S Skyhawk 2015 em condições impecáveis. Equipada com aviônicos modernos Garmin G1000, interior em couro, pintura recente. Manutenção rigorosa com histórico completo. Ideal para treinamento avançado ou voo particular.',
        seller_name: 'LANE AVIATION',
        seller_phone: '+55 (11) 98765-4321',
        seller_email: 'vendas@laneaviation.com.br',
        photos: [{ id: 1, photo_url: '/aircrafts/2015-cessna-172s-skyhawk.png', is_primary: true }],
        status: 'active',
        created_at: new Date().toISOString(),
      },
      'extra-330lx-2020-demo': {
        id: 'extra-330lx-2020-demo',
        title: '2020 EXTRA 330LX',
        manufacturer: 'Extra',
        model: '330LX',
        year: 2020,
        category: 'Aerodesportiva',
        price: 495000,
        currency: 'USD',
        total_time: 450,
        location: 'Rio de Janeiro, Brasil',
        description: 'Extra 330LX 2020 em estado de show room. Aeronave acrobática de alta performance. Motor Lycoming AEIO-580, hélice MT. Painel completo com aviônicos Garmin. Baixo tempo de voo, manutenção em dia.',
        seller_name: 'AirplanesUSA',
        seller_phone: '+55 (21) 97654-3210',
        seller_email: 'sales@airplanesusa.com',
        photos: [{ id: 1, photo_url: '/extra330.png', is_primary: true }],
        status: 'active',
        created_at: new Date().toISOString(),
      },
      'beechcraft-king-air-350i-2018-demo': {
        id: 'beechcraft-king-air-350i-2018-demo',
        title: '2018 BEECHCRAFT KING AIR 350i',
        manufacturer: 'Beechcraft',
        model: 'King Air 350i',
        year: 2018,
        category: 'Bimotor Turboélice',
        price: 6500000,
        currency: 'USD',
        total_time: 1890,
        location: 'Belo Horizonte, Brasil',
        description: 'King Air 350i 2018, configuração executiva premium. Assentos em couro, sistema de entretenimento, Wi-Fi a bordo. Motores PT6A-60A, aviônicos Rockwell Collins Pro Line 21. Histórico de manutenção impecável.',
        seller_name: 'G2G Aviation',
        seller_phone: '+55 (31) 99876-5432',
        seller_email: 'contato@g2gaviation.com',
        photos: [{ id: 1, photo_url: '/aircrafts/2018-beechcraft-king-air-350i.png', is_primary: true }],
        status: 'active',
        created_at: new Date().toISOString(),
      },
      'cessna-citation-m2-2012-demo': {
        id: 'cessna-citation-m2-2012-demo',
        title: '2012 CESSNA CITATION M2',
        manufacturer: 'Cessna',
        model: 'Citation M2',
        year: 2012,
        category: 'Jato de Pequeno Porte',
        price: 3250000,
        currency: 'USD',
        total_time: 2400,
        location: 'Dallas, Texas, EUA',
        description: 'Citation M2 2012 em excelente estado. Jato leve ideal para viagens executivas. Garmin G3000, interior luxuoso com 6 lugares, renovado recentemente. Motores Williams FJ44-1AP-21 com programa de manutenção.',
        seller_name: 'Ava Aviation',
        seller_phone: '+1 (214) 733-4567',
        seller_email: 'sales@avaaviation.com',
        photos: [{ id: 1, photo_url: '/aircrafts/2012-cessna-citation-m2.png', is_primary: true }],
        status: 'active',
        created_at: new Date().toISOString(),
      },
    };

    // Check if this is a demo aircraft
    if (mockAircraft[id]) {
      return NextResponse.json({ data: mockAircraft[id] }, { status: 200 });
    }

    // Increment view count (convert id to integer)
    const aircraftId = parseInt(id);
    if (isNaN(aircraftId)) {
      return NextResponse.json({ message: 'ID inválido' }, { status: 400 });
    }

    await pool.query(
      'UPDATE aircraft_listings SET views = views + 1 WHERE id = $1',
      [aircraftId]
    );

    // Get listing with seller info and photos
    const result = await pool.query(
      `SELECT 
        a.*,
        CONCAT(u.first_name, ' ', u.last_name) as seller_name,
        u.email as seller_email,
        u.mobile_phone as seller_phone,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'url', p.photo_url,
              'display_order', p.display_order,
              'is_primary', p.is_primary
            ) ORDER BY p.display_order, p.is_primary DESC
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as photos
      FROM aircraft_listings a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN classified_photos p ON p.listing_type = 'aircraft' AND p.listing_id = a.id
      WHERE a.id = $1
      GROUP BY a.id, u.first_name, u.last_name, u.email, u.mobile_phone`,
      [aircraftId]
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

// PUT - Update aircraft listing
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
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
      description,
      avionics,
      interior_condition,
      exterior_condition,
      logs_status,
      damage_history,
      financing_available,
      partnership_available,
      status
    } = body;

    const result = await pool.query(
      `UPDATE aircraft_listings SET
        title = COALESCE($1, title),
        manufacturer = COALESCE($2, manufacturer),
        model = COALESCE($3, model),
        year = COALESCE($4, year),
        registration = COALESCE($5, registration),
        serial_number = COALESCE($6, serial_number),
        category = COALESCE($7, category),
        total_time = COALESCE($8, total_time),
        engine_time = COALESCE($9, engine_time),
        price = COALESCE($10, price),
        location_city = COALESCE($11, location_city),
        location_state = COALESCE($12, location_state),
        description = COALESCE($13, description),
        avionics = COALESCE($14, avionics),
        interior_condition = COALESCE($15, interior_condition),
        exterior_condition = COALESCE($16, exterior_condition),
        logs_status = COALESCE($17, logs_status),
        damage_history = COALESCE($18, damage_history),
        financing_available = COALESCE($19, financing_available),
        partnership_available = COALESCE($20, partnership_available),
        status = COALESCE($21, status),
        updated_at = NOW()
      WHERE id = $22
      RETURNING *`,
      [
        title, manufacturer, model, year, registration, serial_number, category,
        total_time, engine_time, price, location_city, location_state, description,
        avionics, interior_condition, exterior_condition, logs_status, damage_history,
        financing_available, partnership_available, status, id
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

// DELETE - Delete aircraft listing
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete associated photos first
    await pool.query(
      `DELETE FROM listing_photos WHERE listing_type = 'aircraft' AND listing_id = $1`,
      [id]
    );

    // Delete listing
    const result = await pool.query(
      'DELETE FROM aircraft_listings WHERE id = $1 RETURNING *',
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
