import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  email: string;
}

// PATCH - Update booking status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de reserva inválido' },
        { status: 400 }
      );
    }

    // JWT Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || '') as JWTPayload;
    } catch (err) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { booking_status, payment_status } = body;

    if (!booking_status && !payment_status) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    // Verify ownership - ensure owner is updating their own booking
    const ownerCheck = await pool.query(
      `SELECT b.id FROM bookings b
       JOIN hangar_listings h ON b.listing_id = h.id
       WHERE b.id = $1 AND h.owner_id = (SELECT id FROM hangar_owners WHERE user_id = $2)`,
      [id, decoded.userId]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Update booking
    const updateQuery = [];
    const updateValues = [];
    let paramIndex = 1;

    if (booking_status) {
      updateQuery.push(`booking_status = $${paramIndex++}`);
      updateValues.push(booking_status);
    }

    if (payment_status) {
      updateQuery.push(`payment_status = $${paramIndex++}`);
      updateValues.push(payment_status);
    }

    updateQuery.push(`updated_at = NOW()`);
    updateValues.push(id);

    const result = await pool.query(
      `UPDATE bookings SET ${updateQuery.join(', ')} WHERE id = $${paramIndex} RETURNING id`,
      updateValues
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Reserva atualizada com sucesso',
      bookingId: result.rows[0].id,
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar reserva' },
      { status: 500 }
    );
  }
}
