// API Route: Check feature flag status
// File: src/app/api/admin/feature-flags/check/route.ts
// Purpose: Query feature_flags table to determine if a feature is enabled

import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const flagName = searchParams.get('flag');

    // Validate input
    if (!flagName) {
      return NextResponse.json(
        { message: 'Flag name required', error: 'Missing query parameter: flag' },
        { status: 400 }
      );
    }

    // Query database for flag
    const result = await pool.query(
      'SELECT name, enabled FROM feature_flags WHERE name = $1',
      [flagName]
    );

    // Handle missing flag (return false by default)
    const flag = result.rows[0];
    if (!flag) {
      return NextResponse.json(
        { 
          enabled: false, 
          flag: flagName,
          message: 'Flag not found, defaulting to disabled'
        },
        { status: 200 }
      );
    }

    // Return flag status
    return NextResponse.json(
      { 
        enabled: flag.enabled, 
        flag: flag.name,
        message: 'Feature flag status retrieved'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Feature flag check error:', error);
    return NextResponse.json(
      { 
        message: 'Error checking feature flag', 
        error: String(error),
        enabled: false // Fail-safe: disable feature on error
      },
      { status: 500 }
    );
  }
}

// Optional: POST endpoint to update flag (admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { flag, enabled } = body;

    // Validate input
    if (!flag || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { message: 'Invalid request body. Required: flag (string), enabled (boolean)' },
        { status: 400 }
      );
    }

    // Update flag
    const result = await pool.query(
      'UPDATE feature_flags SET enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE name = $2 RETURNING *',
      [enabled, flag]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Flag not found' },
        { status: 404 }
      );
    }

    const updatedFlag = result.rows[0];
    console.log(`Feature flag '${flag}' updated to ${enabled}`);

    return NextResponse.json(
      { 
        message: 'Feature flag updated successfully',
        flag: updatedFlag.name,
        enabled: updatedFlag.enabled,
        updatedAt: updatedFlag.updated_at
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Feature flag update error:', error);
    return NextResponse.json(
      { 
        message: 'Error updating feature flag', 
        error: String(error)
      },
      { status: 500 }
    );
  }
}
