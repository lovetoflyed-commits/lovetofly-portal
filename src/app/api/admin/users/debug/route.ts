import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin } from '@/utils/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) {
      return NextResponse.json({
        step: 'auth',
        error: authError.status,
        message: 'Authentication failed'
      }, { status: authError.status });
    }

    console.log('[DEBUG Users Endpoint] Auth passed');

    // Step 1: Test basic connection
    console.log('[DEBUG Users Endpoint] Testing database connection...');
    const connTest = await pool.query('SELECT NOW()');
    console.log('[DEBUG Users Endpoint] Connection OK:', connTest.rows[0]);

    // Step 2: Test users table exists
    console.log('[DEBUG Users Endpoint] Checking users table...');
    const tableTest = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' LIMIT 1"
    );
    console.log('[DEBUG Users Endpoint] Users table exists, columns:', tableTest.rows.length);

    // Step 3: Count users
    console.log('[DEBUG Users Endpoint] Counting users...');
    const countTest = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = Number(countTest.rows[0]?.count || 0);
    console.log('[DEBUG Users Endpoint] Total users in DB:', userCount);

    // Step 4: Test LEFT JOIN with user_access_status
    console.log('[DEBUG Users Endpoint] Testing LEFT JOIN with user_access_status...');
    const joinTest = await pool.query(`
      SELECT u.id, u.first_name, uas.access_level
      FROM users u
      LEFT JOIN user_access_status uas ON u.id = uas.user_id
      LIMIT 1
    `);
    console.log('[DEBUG Users Endpoint] JOIN test result:', joinTest.rows.length, 'rows');

    // Step 5: Run actual query with parameters
    console.log('[DEBUG Users Endpoint] Running actual query with params...');
    const limit = 20;
    const offset = 0;
    const result = await pool.query(
      `SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.aviation_role,
        u.plan,
        u.created_at,
        u.user_type,
        u.user_type_verified,
        uas.access_level,
        uas.access_reason
      FROM users u
      LEFT JOIN user_access_status uas ON u.id = uas.user_id
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    console.log('[DEBUG Users Endpoint] Query result:', result.rows.length, 'rows');

    return NextResponse.json({
      success: true,
      steps: {
        auth: 'passed',
        connection: 'OK',
        tableExists: tableTest.rows.length > 0,
        userCount,
        joinTest: joinTest.rows.length,
        actualQuery: result.rows.length
      },
      data: {
        users: result.rows,
        count: result.rows.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[DEBUG Users Endpoint] ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
