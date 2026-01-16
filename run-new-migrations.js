const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrations = [
  '046_create_membership_tables.sql',
  '047_add_paid_fields_to_hangar_listings.sql',
  '048_create_notifications_tables.sql',
  '049_create_portal_analytics_table.sql',
];

(async () => {
  const client = await pool.connect();
  try {
    for (const mig of migrations) {
      const filePath = path.join('/Users/edsonassumpcao/Desktop/lovetofly-portal/src/migrations', mig);
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${mig} not found, skipping`);
        continue;
      }
      const sql = fs.readFileSync(filePath, 'utf8');
      try {
        await client.query(sql);
        console.log(`✅ ${mig} executed successfully`);
      } catch (err) {
        console.error(`❌ ${mig} failed:`, err.message);
      }
    }
  } finally {
    await client.release();
    await pool.end();
  }
})();
