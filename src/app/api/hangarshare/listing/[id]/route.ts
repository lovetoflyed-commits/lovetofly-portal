import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'ID de hangar inválido' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT 
        h.id,
        h.hangar_number as "hangarNumber",
        h.icao_code as "icao",
        h.aerodrome_name as "aerodromeName",
        h.city,
        h.state,
        h.hangar_size_sqm as "sizeSqm",
        h.max_wingspan_meters as "maxWingspan",
        h.max_length_meters as "maxLength",
        h.max_height_meters as "maxHeight",
        h.accepted_aircraft_categories as "aircraftCategories",
        h.hourly_rate as "hourlyRate",
        h.daily_rate as "dailyRate",
        h.weekly_rate as "weeklyRate",
        h.monthly_rate as "monthlyRate",
        h.operating_hours as "operatingHours",
        h.services,
        h.description,
        h.special_notes as "specialNotes",
        h.photos,
        h.is_available as "isActive",
        h.created_at as "createdAt",
        u.first_name || ' ' || u.last_name as "ownerName",
        u.email as "ownerEmail",
        u.mobile_phone as "ownerPhone"
      FROM hangar_listings h
      LEFT JOIN users u ON h.owner_id = u.id
      WHERE h.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Hangar não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hangar: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching hangar:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar hangar' },
      { status: 500 }
    );
  }
}
