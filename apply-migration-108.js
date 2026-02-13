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
    console.log('Applying migration 108 to Neon database...\n');

    const migrationFile = path.join(__dirname, 'src/migrations/108_add_missing_user_activity_log_columns.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    console.log('Executing SQL...');
    await client.query(sql);
    console.log('✅ Migration 108 applied successfully!');

    // Verify columns were added
    console.log('\nVerifying columns...');
    const result = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'user_activity_log'
      ORDER BY ordinal_position
    `);

    console.log('user_activity_log columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });

    const hasActivityCategory = result.rows.find(r => r.column_name === 'activity_category');
    console.log(`\n${hasActivityCategory ? '✅' : '❌'} activity_category column present`);

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
