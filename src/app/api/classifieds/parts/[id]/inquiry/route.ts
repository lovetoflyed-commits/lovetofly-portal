import { NextResponse } from 'next/server';
import pool from '@/config/db';

// POST - Send inquiry to seller
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { sender_id, name, email, phone, message } = body;

    if (!sender_id || !name || !email || !message) {
      return NextResponse.json(
        { message: 'Campos obrigatórios: sender_id, name, email, message' },
        { status: 400 }
      );
    }

    // Get listing and seller info
    const listingResult = await pool.query(
      'SELECT user_id FROM parts_listings WHERE id = $1',
      [id]
    );

    if (listingResult.rows.length === 0) {
      return NextResponse.json({ message: 'Anúncio não encontrado' }, { status: 404 });
    }

    const seller_id = listingResult.rows[0].user_id;

    // Create inquiry
    const result = await pool.query(
      `INSERT INTO listing_inquiries (
        listing_type, listing_id, sender_id, seller_id, name, email, phone, message, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new')
      RETURNING *`,
      ['parts', id, sender_id, seller_id, name, email, phone, message]
    );

    return NextResponse.json(
      { data: result.rows[0], message: 'Mensagem enviada com sucesso! O anunciante receberá sua solicitação.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return NextResponse.json({ message: 'Erro ao enviar mensagem' }, { status: 500 });
  }
}

// GET - Get inquiries for a listing (seller only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ message: 'user_id obrigatório' }, { status: 400 });
    }

    // Verify user owns the listing
    const ownerCheck = await pool.query(
      'SELECT user_id FROM parts_listings WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ message: 'Anúncio não encontrado' }, { status: 404 });
    }

    if (ownerCheck.rows[0].user_id !== parseInt(user_id)) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    // Get inquiries
    const result = await pool.query(
      `SELECT 
        i.*,
        u.name as sender_name
      FROM listing_inquiries i
      LEFT JOIN users u ON i.sender_id = u.id
      WHERE i.listing_type = 'parts' AND i.listing_id = $1
      ORDER BY i.created_at DESC`,
      [id]
    );

    return NextResponse.json({ data: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return NextResponse.json({ message: 'Erro ao buscar mensagens' }, { status: 500 });
  }
}
