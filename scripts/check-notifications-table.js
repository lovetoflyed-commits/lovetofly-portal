// Check if notifications table exists
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Checking notifications table...');
    
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      );
    `);
    
    const exists = result.rows[0].exists;
    
    if (exists) {
      console.log('✅ Notifications table already exists!');
      
      // Get column info
      const columns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'notifications'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Table structure:');
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ Notifications table does NOT exist. Run migration first.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTable();
