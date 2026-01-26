import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = id;

    const result = await pool.query(
      `
      SELECT
        hb.*, 
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        u.email AS user_email,
        CONCAT(hl.hangar_number, ' - ', hl.aerodrome_name) AS hangar_title,
        hl.city AS hangar_city,
        hl.state AS hangar_state
      FROM hangar_bookings hb
      JOIN users u ON hb.user_id = u.id
      JOIN hangar_listings hl ON hb.hangar_id = hl.id
      WHERE hb.id = $1
      LIMIT 1
      `,
      [bookingId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Error fetching booking:', err);
    return NextResponse.json(
      { message: 'Error fetching booking', error: err },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = id;
    const body = await request.json();

    const columnsResult = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'hangar_bookings'"
    );
    const columns = new Set(columnsResult.rows.map((row: any) => row.column_name));

    const allowedFields = [
      'check_in',
      'check_out',
      'nights',
      'subtotal',
      'fees',
      'total_price',
      'status',
      'payment_method',
      'booking_type',
      'refund_policy_applied'
    ].filter((field) => columns.has(field));

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(body || {}).forEach(([key, value]) => {
      if (!allowedFields.includes(key)) return;
      updates.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    });

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    if (columns.has('updated_at')) {
      updates.push('updated_at = NOW()');
    }

    values.push(bookingId);

    const query = `
      UPDATE hangar_bookings
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Booking updated successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Error updating booking:', err);
    return NextResponse.json(
      { message: 'Error updating booking', error: err },
      { status: 500 }
    );
  }
}