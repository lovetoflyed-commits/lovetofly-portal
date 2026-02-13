const fs = require('fs');
const path = require('path');
const pg = require('pg');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('Dropping old UUID-based messaging tables...');
    
    // Drop in correct order (respecting foreign keys)
    await client.query('DROP TABLE IF EXISTS portal_message_reports CASCADE;');
    await client.query('DROP TABLE IF EXISTS portal_messages CASCADE;');
    await client.query('DROP TABLE IF EXISTS moderation_messages CASCADE;');
    await client.query('DROP TABLE IF EXISTS bad_conduct_alerts CASCADE;');
    
    console.log('✅ Old tables dropped successfully!');

    // Now re-create with INTEGER columns from migration 105
    const migration105 = fs.readFileSync(
      path.join(__dirname, 'src/migrations/105_create_messaging_tables_integer_fix.sql'),
      'utf-8'
    );
    await client.query(migration105);
    console.log('✅ Migration 105 applied successfully (recreated tables with INTEGER)!');

  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
