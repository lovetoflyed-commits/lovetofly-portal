import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

import pool from '@/config/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const fullName = String(formData.get('fullName') || '').trim();
    const contactEmail = String(formData.get('contactEmail') || '').trim();
    const contactPhone = String(formData.get('contactPhone') || '').trim();
    const licenseType = String(formData.get('licenseType') || '').trim();
    const licenseNumber = String(formData.get('licenseNumber') || '').trim();
    const medicalExpiry = String(formData.get('medicalExpiry') || '').trim();
    const totalHours = String(formData.get('totalHours') || '').trim();
    const ratings = String(formData.get('ratings') || '').trim();
    const categories = String(formData.get('categories') || '').trim();
    const baseCity = String(formData.get('baseCity') || '').trim();
    const availability = String(formData.get('availability') || '').trim();
    const notes = String(formData.get('notes') || '').trim();

    if (!fullName || !contactEmail || !licenseType || !licenseNumber) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const licenseDocument = formData.get('licenseDocument') as File | null;
    const medicalDocument = formData.get('medicalDocument') as File | null;

    if (!licenseDocument || !medicalDocument) {
      return NextResponse.json({ message: 'Missing required documents' }, { status: 400 });
    }

    let userId: number | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, secret) as { userId?: string; id?: string };
        const resolvedUserId = decoded.userId ?? decoded.id;
        if (resolvedUserId) {
          userId = Number(resolvedUserId);
        }
      } catch (error) {
        console.warn('Invalid auth token for traslados pilot:', error);
      }
    }

    const insertResult = await pool.query(
      `INSERT INTO traslados_pilots (
        user_id,
        full_name,
        contact_email,
        contact_phone,
        license_type,
        license_number,
        medical_expiry,
        total_hours,
        ratings,
        categories,
        base_city,
        availability,
        status,
        notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', $13
      ) RETURNING id`,
      [
        userId,
        fullName,
        contactEmail,
        contactPhone || null,
        licenseType,
        licenseNumber,
        medicalExpiry || null,
        totalHours ? Number(totalHours) : null,
        ratings || null,
        categories || null,
        baseCity || null,
        availability || null,
        notes || null,
      ]
    );

    const pilotId = insertResult.rows[0]?.id as number | undefined;

    if (pilotId) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'traslados', 'pilots', String(pilotId));
      await mkdir(uploadDir, { recursive: true });

      const saveDocument = async (file: File, documentType: string) => {
        const maxSize = 10 * 1024 * 1024;
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (file.size > maxSize) {
          throw new Error(`Arquivo ${file.name} excede o limite de 10MB`);
        }
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Tipo de arquivo inválido: ${file.name}`);
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `${Date.now()}_${safeName}`;
        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        const publicPath = `/uploads/traslados/pilots/${pilotId}/${filename}`;

        await pool.query(
          `INSERT INTO traslados_pilot_documents (
            pilot_id,
            document_type,
            file_path,
            file_name,
            mime_type
          ) VALUES ($1, $2, $3, $4, $5)`,
          [pilotId, documentType, publicPath, file.name, file.type]
        );
      };

      const logbookDocument = formData.get('logbookDocument') as File | null;
      const additionalDocuments = formData.getAll('additionalDocuments') as File[];

      try {
        await saveDocument(licenseDocument, 'license');
        await saveDocument(medicalDocument, 'medical');
        if (logbookDocument) {
          await saveDocument(logbookDocument, 'logbook');
        }
        for (const file of additionalDocuments) {
          await saveDocument(file, 'additional');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid document upload';
        return NextResponse.json({ message }, { status: 400 });
      }
    }

    return NextResponse.json({ message: 'Pilot application submitted', pilotId }, { status: 200 });
  } catch (error) {
    console.error('Pilot submission error:', error);
    return NextResponse.json({ message: 'Error submitting pilot data' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'approved';

    const pilotsResult = await pool.query(
      `SELECT * FROM traslados_pilots WHERE status = $1 ORDER BY created_at DESC`,
      [status]
    );

    const pilotIds = pilotsResult.rows.map((pilot) => pilot.id);
    let documents = [] as Array<{ pilot_id: number; document_type: string; file_path: string; file_name: string | null }>;

    if (pilotIds.length > 0) {
      const docsResult = await pool.query(
        `SELECT pilot_id, document_type, file_path, file_name
         FROM traslados_pilot_documents
         WHERE pilot_id = ANY($1::int[])`,
        [pilotIds]
      );
      documents = docsResult.rows;
    }

    return NextResponse.json({
      pilots: pilotsResult.rows,
      documents,
    });
  } catch (error) {
    console.error('Error fetching pilots:', error);
    return NextResponse.json({ message: 'Error fetching pilots' }, { status: 500 });
  }
}
