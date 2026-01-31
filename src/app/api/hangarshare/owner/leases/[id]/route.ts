import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/config/db';

interface JWTPayload {
  id?: number;
  userId?: number;
  email?: string;
}

const VALID_STATUSES = new Set(['draft', 'active', 'expired', 'cancelled']);

function getUserIdFromRequest(request: NextRequest): number | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const secret = process.env.JWT_SECRET || 'your-secret-key';

  try {
    const decoded = jwt.verify(token, secret) as JWTPayload;
    const rawId = decoded.userId ?? decoded.id;
    const userId = typeof rawId === 'string' ? Number.parseInt(rawId, 10) : rawId;
    return Number.isFinite(userId) ? (userId as number) : null;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const ownerResult = await pool.query(
      'SELECT id FROM hangar_owners WHERE user_id = $1',
      [userId]
    );

    if (ownerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Proprietário não encontrado' }, { status: 404 });
    }

    const ownerId = ownerResult.rows[0].id as number;
    const { id } = await params;

    const result = await pool.query(
      `SELECT 
        l.id,
        l.listing_id,
        l.owner_id,
        l.lease_template_id,
        l.status,
        l.start_date,
        l.end_date,
        l.signed_at,
        l.created_at,
        l.updated_at,
        hl.icao_code,
        hl.hangar_number,
        t.name as template_name,
        t.version as template_version,
        t.content_url as template_url
      FROM hangar_leases l
      JOIN hangar_listings hl ON hl.id = l.listing_id
      LEFT JOIN hangar_lease_templates t ON t.id = l.lease_template_id
      WHERE l.id = $1 AND l.owner_id = $2`,
      [id, ownerId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ lease: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching lease:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar contrato' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const ownerResult = await pool.query(
      'SELECT id FROM hangar_owners WHERE user_id = $1',
      [userId]
    );

    if (ownerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Proprietário não encontrado' }, { status: 404 });
    }

    const ownerId = ownerResult.rows[0].id as number;
    const { id } = await params;
    const body = await request.json();

    const updates: string[] = [];
    const values: Array<string | number | null> = [];
    let idx = 1;

    if (body.status) {
      if (!VALID_STATUSES.has(body.status)) {
        return NextResponse.json(
          { error: 'Status de contrato inválido' },
          { status: 400 }
        );
      }
      updates.push(`status = $${idx++}`);
      values.push(body.status);

      if (body.status === 'active' && !body.signed_at && !body.signedAt) {
        updates.push('signed_at = COALESCE(signed_at, NOW())');
      }
    }

    if (body.lease_template_id || body.leaseTemplateId) {
      updates.push(`lease_template_id = $${idx++}`);
      values.push(body.lease_template_id ?? body.leaseTemplateId);
    }

    if (body.start_date || body.startDate) {
      updates.push(`start_date = $${idx++}`);
      values.push(body.start_date ?? body.startDate);
    }

    if (body.end_date || body.endDate) {
      updates.push(`end_date = $${idx++}`);
      values.push(body.end_date ?? body.endDate);
    }

    if (body.signed_at || body.signedAt) {
      updates.push(`signed_at = $${idx++}`);
      values.push(body.signed_at ?? body.signedAt);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    const updateQuery = `UPDATE hangar_leases 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${idx++} AND owner_id = $${idx}
      RETURNING *`;

    values.push(id, ownerId);

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ lease: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error('Error updating lease:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar contrato' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const ownerResult = await pool.query(
      'SELECT id FROM hangar_owners WHERE user_id = $1',
      [userId]
    );

    if (ownerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Proprietário não encontrado' }, { status: 404 });
    }

    const ownerId = ownerResult.rows[0].id as number;
    const { id } = await params;

    const result = await pool.query(
      'DELETE FROM hangar_leases WHERE id = $1 AND owner_id = $2 RETURNING id',
      [id, ownerId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting lease:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir contrato' },
      { status: 500 }
    );
  }
}
