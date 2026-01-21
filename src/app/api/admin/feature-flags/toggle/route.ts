// API Route: Toggle feature flag status
// File: src/app/api/admin/feature-flags/toggle/route.ts
// Purpose: Enable/disable feature flags

import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { flag, enabled } = body;

    // Validate input
    if (!flag || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { 
          message: 'Invalid request', 
          error: 'Required: { flag: string, enabled: boolean }' 
        },
        { status: 400 }
      );
    }

    // Update flag status
    const result = await pool.query(
      'UPDATE feature_flags SET enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE name = $2 RETURNING *',
      [enabled, flag]
    );

    // Handle missing flag
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Feature flag not found', flag },
        { status: 404 }
      );
    }

    // Return updated flag
    return NextResponse.json(
      { 
        message: `Feature flag ${enabled ? 'enabled' : 'disabled'}`,
        flag: result.rows[0].name,
        enabled: result.rows[0].enabled,
        updated_at: result.rows[0].updated_at
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Feature flag toggle error:', error);
    return NextResponse.json(
      { message: 'Failed to toggle feature flag', error: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve all feature flags
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT id, name, enabled, description, created_at, updated_at FROM feature_flags ORDER BY name'
    );

    return NextResponse.json(
      { 
        message: 'Feature flags retrieved',
        count: result.rows.length,
        flags: result.rows
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Feature flags retrieval error:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve feature flags', error: String(error) },
      { status: 500 }
    );
  }
}
