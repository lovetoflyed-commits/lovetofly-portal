const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function applyMigration() {
  const client = await pool.connect();
  try {
    const migration = fs.readFileSync(
      path.join(__dirname, 'src/migrations/104_fix_messaging_uuid_to_integer.sql'),
      'utf8'
    );

    console.log('Applying migration 104_fix_messaging_uuid_to_integer.sql...');
    await client.query(migration);
    console.log('✅ Migration applied successfully');
    
    // Verify the columns are now INTEGER
    const check = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'portal_messages' AND column_name IN ('sender_user_id', 'recipient_user_id')
      ORDER BY column_name
    `);
    
    console.log('\n📊 Verification:');
    check.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
