import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || '';
    let userId: string;

    try {
      const decoded = jwt.verify(token, secret) as any;
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const listingId = parseInt(id);

    // Verify ownership
    const ownerResult = await pool.query(
      'SELECT user_id FROM aircraft_listings WHERE id = $1',
      [listingId]
    );

    if (ownerResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Anúncio não encontrado' },
        { status: 404 }
      );
    }

    if (ownerResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { message: 'Você não tem permissão para editar este anúncio' },
        { status: 403 }
      );
    }

    // Build update query dynamically
    const allowedFields = [
      'title', 'manufacturer', 'model', 'year', 'registration', 'serial_number',
      'category', 'total_time', 'engine_time', 'price', 'location_city',
      'location_state', 'description', 'avionics', 'interior_condition',
      'exterior_condition', 'logs_status', 'damage_history',
      'financing_available', 'partnership_available', 'status'
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        updateValues.push(body[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { message: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    // Add updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    updateValues.push(listingId);

    const query = `
      UPDATE aircraft_listings
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await pool.query(query, updateValues);

    return NextResponse.json(
      { message: 'Anúncio atualizado com sucesso', data: result.rows[0] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update aircraft error:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar anúncio' },
      { status: 500 }
    );
  }
}
