const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(
      path.join('/Users/edsonassumpcao/Desktop/lovetofly-portal/src/migrations', '050_add_stripe_payment_to_hangar_listings.sql'),
      'utf8'
    );
    await client.query(sql);
    console.log('✅ Migration 050 executed successfully');
  } catch (err) {
    console.error('❌ Migration 050 failed:', err.message);
  } finally {
    await client.release();
    await pool.end();
  }
})();
