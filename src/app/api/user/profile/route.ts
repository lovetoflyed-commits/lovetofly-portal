import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/config/db';

export async function GET(request: Request) {
  try {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };
    const userId = decoded?.id;

    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Buscar dados do usuário
    const result = await pool.query(
      `SELECT 
        id,
        first_name,
        last_name,
        cpf,
        email,
        mobile_phone,
        address_street,
        address_number,
        address_complement,
        address_neighborhood,
        address_city,
        address_state,
        address_zip,
        address_country,
        aviation_role,
        aviation_role_other,
        licencas,
        habilitacoes,
        curso_atual,
        avatar_url
      FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];

    // Calcular horas totais do flight_logs (sum all time columns)
    const hoursResult = await pool.query(
      `SELECT 
        ROUND(CAST((
          COALESCE(SUM(EXTRACT(EPOCH FROM time_diurno)), 0) +
          COALESCE(SUM(EXTRACT(EPOCH FROM time_noturno)), 0) +
          COALESCE(SUM(EXTRACT(EPOCH FROM time_ifr_real)), 0) +
          COALESCE(SUM(EXTRACT(EPOCH FROM time_under_hood)), 0) +
          COALESCE(SUM(EXTRACT(EPOCH FROM time_simulator)), 0)
        ) / 3600 AS NUMERIC), 0) as total_hours
      FROM flight_logs 
      WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    const totalFlightHours = hoursResult.rows[0]?.total_hours || 0;

    // Checar se o usuário é anunciante ativo no HangarShare
    const hangarResult = await pool.query(
      `SELECT 1 FROM hangar_listings WHERE owner_id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );
    const isHangarshareAdvertiser = hangarResult.rows.length > 0;

    return NextResponse.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      cpf: user.cpf,
      email: user.email,
      mobilePhone: user.mobile_phone,
      addressStreet: user.address_street,
      addressNumber: user.address_number,
      addressComplement: user.address_complement,
      addressNeighborhood: user.address_neighborhood,
      addressCity: user.address_city,
      addressState: user.address_state,
      addressZip: user.address_zip,
      addressCountry: user.address_country,
      aviationRole: user.aviation_role,
      aviationRoleOther: user.aviation_role_other,
      licencas: user.licencas,
      habilitacoes: user.habilitacoes,
      curso_atual: user.curso_atual,
      total_flight_hours: totalFlightHours,
      avatarUrl: user.avatar_url,
      isHangarshareAdvertiser,
    });
  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };
    const userId = decoded?.id;

    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      mobilePhone,
      addressStreet,
      addressNumber,
      addressComplement,
      addressNeighborhood,
      addressCity,
      addressState,
      addressZip,
      addressCountry,
      aviationRole,
      aviationRoleOther,
      licencas,
      habilitacoes,
      curso_atual,
    } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramIndex}`);
      params.push(firstName);
      paramIndex++;
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramIndex}`);
      params.push(lastName);
      paramIndex++;
    }
    if (mobilePhone !== undefined) {
      updates.push(`mobile_phone = $${paramIndex}`);
      params.push(mobilePhone);
      paramIndex++;
    }
    if (addressStreet !== undefined) {
      updates.push(`address_street = $${paramIndex}`);
      params.push(addressStreet);
      paramIndex++;
    }
    if (addressNumber !== undefined) {
      updates.push(`address_number = $${paramIndex}`);
      params.push(addressNumber);
      paramIndex++;
    }
    if (addressComplement !== undefined) {
      updates.push(`address_complement = $${paramIndex}`);
      params.push(addressComplement);
      paramIndex++;
    }
    if (addressNeighborhood !== undefined) {
      updates.push(`address_neighborhood = $${paramIndex}`);
      params.push(addressNeighborhood);
      paramIndex++;
    }
    if (addressCity !== undefined) {
      updates.push(`address_city = $${paramIndex}`);
      params.push(addressCity);
      paramIndex++;
    }
    if (addressState !== undefined) {
      updates.push(`address_state = $${paramIndex}`);
      params.push(addressState);
      paramIndex++;
    }
    if (addressZip !== undefined) {
      updates.push(`address_zip = $${paramIndex}`);
      params.push(addressZip);
      paramIndex++;
    }
    if (addressCountry !== undefined) {
      updates.push(`address_country = $${paramIndex}`);
      params.push(addressCountry);
      paramIndex++;
    }
    if (aviationRole !== undefined) {
      updates.push(`aviation_role = $${paramIndex}`);
      params.push(aviationRole);
      paramIndex++;
    }
    if (aviationRoleOther !== undefined) {
      updates.push(`aviation_role_other = $${paramIndex}`);
      params.push(aviationRoleOther);
      paramIndex++;
    }
    if (licencas !== undefined) {
      updates.push(`licencas = $${paramIndex}`);
      params.push(licencas);
      paramIndex++;
    }
    if (habilitacoes !== undefined) {
      updates.push(`habilitacoes = $${paramIndex}`);
      params.push(habilitacoes);
      paramIndex++;
    }
    if (curso_atual !== undefined) {
      updates.push(`curso_atual = $${paramIndex}`);
      params.push(curso_atual);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    params.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        first_name,
        last_name,
        cpf,
        email,
        mobile_phone,
        address_street,
        address_number,
        address_complement,
        address_neighborhood,
        address_city,
        address_state,
        address_zip,
        address_country,
        aviation_role,
        aviation_role_other,
        licencas,
        habilitacoes,
        curso_atual,
        avatar_url
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];

    return NextResponse.json({
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        cpf: user.cpf,
        email: user.email,
        mobilePhone: user.mobile_phone,
        addressStreet: user.address_street,
        addressNumber: user.address_number,
        addressComplement: user.address_complement,
        addressNeighborhood: user.address_neighborhood,
        addressCity: user.address_city,
        addressState: user.address_state,
        addressZip: user.address_zip,
        addressCountry: user.address_country,
        aviationRole: user.aviation_role,
        aviationRoleOther: user.aviation_role_other,
        licencas: user.licencas,
        habilitacoes: user.habilitacoes,
        curso_atual: user.curso_atual,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
