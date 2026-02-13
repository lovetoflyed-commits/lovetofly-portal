const pg = require('pg');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('Full schema comparison:\n');

    // user_activity_log columns
    console.log('=== user_activity_log columns ===');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_activity_log'
      ORDER BY ordinal_position
    `);
    
    result.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });

    // Check if activity_category column exists
    console.log('\n=== Status ===');
    const hasCat = result.rows.find(r => r.column_name === 'activity_category');
    console.log(hasCat ? '✅ activity_category exists' : '❌ activity_category missing');

    // Check for any recent tables that might be missing
    console.log('\n=== Checking all tables with "message" or "alert" or "activity" ===');
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema='public'
      AND (table_name ILIKE '%message%' OR table_name ILIKE '%alert%' OR table_name ILIKE '%activity%')
      ORDER BY table_name
    `);
    
    tables.rows.forEach(t => {
      console.log(`  - ${t.table_name}`);
    });

  } finally {
    client.release();
    await pool.end();
  }
})();
