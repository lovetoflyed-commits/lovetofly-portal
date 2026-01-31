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

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ leases: [] }, { status: 200 });
    }

    const ownerId = ownerResult.rows[0].id as number;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const params: Array<string | number> = [ownerId];
    let statusFilter = '';
    if (status) {
      statusFilter = 'AND l.status = $2';
      params.push(status);
    }

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
      WHERE l.owner_id = $1
      ${statusFilter}
      ORDER BY l.created_at DESC`,
      params
    );

    return NextResponse.json({ leases: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching leases:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar contratos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    const listingId = body.listing_id ?? body.listingId;
    const leaseTemplateId = body.lease_template_id ?? body.leaseTemplateId ?? null;
    const status = body.status ?? 'draft';
    const startDate = body.start_date ?? body.startDate ?? null;
    const endDate = body.end_date ?? body.endDate ?? null;
    const signedAt = body.signed_at ?? body.signedAt ?? null;

    if (!listingId) {
      return NextResponse.json(
        { error: 'listing_id é obrigatório' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: 'Status de contrato inválido' },
        { status: 400 }
      );
    }

    const listingCheck = await pool.query(
      'SELECT id FROM hangar_listings WHERE id = $1 AND owner_id = $2',
      [listingId, ownerId]
    );

    if (listingCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Hangar não encontrado para este proprietário' },
        { status: 403 }
      );
    }

    const insertResult = await pool.query(
      `INSERT INTO hangar_leases (
        listing_id,
        owner_id,
        lease_template_id,
        status,
        start_date,
        end_date,
        signed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [listingId, ownerId, leaseTemplateId, status, startDate, endDate, signedAt]
    );

    return NextResponse.json({ lease: insertResult.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating lease:', error);
    return NextResponse.json(
      { error: 'Erro ao criar contrato' },
      { status: 500 }
    );
  }
}
