const pg = require('pg');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('Checking table schemas on Neon database...\n');

    const tables = [
      'portal_messages',
      'moderation_messages',
      'bad_conduct_alerts',
      'user_activity_log'
    ];

    for (const table of tables) {
      try {
        const result = await client.query(
          `SELECT column_name, data_type, is_nullable
           FROM information_schema.columns
           WHERE table_name = $1
           ORDER BY ordinal_position`,
          [table]
        );
        
        console.log(`\n=== ${table} ===`);
        console.log(`Columns: ${result.rows.length}`);
        result.rows.slice(0, 5).forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        if (result.rows.length > 5) {
          console.log(`  ... and ${result.rows.length - 5} more columns`);
        }
      } catch (err) {
        console.log(`❌ Error reading ${table}: ${err.message}`);
      }
    }

    // Check user_activity_log for activity_category column
    console.log('\n\nChecking user_activity_log columns:');
    try {
      const result = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'user_activity_log'
        ORDER BY ordinal_position
      `);
      console.log('Columns:', result.rows.map(r => r.column_name).join(', '));
    } catch (err) {
      console.log('Error:', err.message);
    }

  } finally {
    client.release();
    await pool.end();
  }
})();
