const pg = require('pg');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('Checking migrations on Neon database...\n');

    // Check if migrations table exists
    try {
      const result = await client.query(`
        SELECT * FROM pgmigrations 
        ORDER BY name DESC 
        LIMIT 20
      `);
      
      console.log('Last 20 migrations applied:');
      result.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.name}`);
      });
      console.log('\nTotal migrations applied:', result.rows.length);
    } catch (err) {
      if (err.code === '42P01') {
        console.log('❌ pgmigrations table not found - migrations may not have been tracked');
      } else {
        console.log('Error checking migrations:', err.message);
      }
    }

    // Check which new tables exist
    console.log('\n\nChecking new feature tables:');
    
    const tables = [
      'portal_messages',
      'moderation_messages',
      'bad_conduct_alerts',
      'portal_message_reports',
      'user_activity_log'
    ];

    for (const table of tables) {
      try {
        const result = await client.query(
          `SELECT COUNT(*) FROM information_schema.tables WHERE table_name = $1`,
          [table]
        );
        if (result.rows[0].count > 0) {
          console.log(`✅ ${table} exists`);
        } else {
          console.log(`❌ ${table} missing`);
        }
      } catch (err) {
        console.log(`❌ ${table} - error: ${err.message}`);
      }
    }

  } finally {
    client.release();
    await pool.end();
  }
})();
