import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ownerId = id;
    const body = await request.json();

    const columnsResult = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'hangar_owners'"
    );
    const columns = new Set(columnsResult.rows.map((row: any) => row.column_name));

    const allowedFields = [
      'company_name',
      'cnpj',
      'phone',
      'address',
      'website',
      'description',
      'owner_type',
      'cpf',
      'pix_key',
      'pix_key_type',
      'verification_status',
      'is_verified'
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

    values.push(ownerId);

    const query = `
      UPDATE hangar_owners
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Owner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Owner updated successfully',
      owner: result.rows[0]
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Error updating owner:', err);
    return NextResponse.json(
      { message: 'Error updating owner', error: err },
      { status: 500 }
    );
  }
}