const fs = require('fs');
const path = require('path');
const pg = require('pg');

const migrationFile = path.join(__dirname, 'src/migrations/106_fix_messaging_uuid_to_integer.sql');
const sql = fs.readFileSync(migrationFile, 'utf-8');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('Applying migration 106_fix_messaging_uuid_to_integer.sql...');
    await client.query(sql);
    console.log('✅ Migration 106 applied successfully!');
  } catch (err) {
    console.error('❌ Migration 106 failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
