const pg = require('pg');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('Testing updated /api/admin/users query:\n');

    // Test basic query
    try {
      const result = await client.query(`
        SELECT
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
        WHERE u.deleted_at IS NULL
        ORDER BY u.created_at DESC
        LIMIT 20 OFFSET 0
      `);
      console.log(`✅ Query succeeded! Rows: ${result.rows.length}`);
      if (result.rows.length > 0) {
        console.log('First row keys:', Object.keys(result.rows[0]));
      }
    } catch (err) {
      console.log('❌ Query failed:', err.message);
    }

  } finally {
    client.release();
    await pool.end();
  }
})();
