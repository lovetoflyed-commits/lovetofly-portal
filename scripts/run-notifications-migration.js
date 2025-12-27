// Run notifications table migration using Node.js
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 Running notifications table migration...');
    
    const migrationPath = path.join(__dirname, '..', 'src', 'migrations', '013_create_notifications_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📊 Connecting to database...');
    await pool.query(sql);
    
    console.log('✅ Notifications table migration completed successfully!');
    console.log('');
    console.log('📋 Table created:');
    console.log('   - notifications (id, user_id, title, message, type, read, link, created_at)');
    console.log('');
    console.log('🎯 Next: The email system is ready to use!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
