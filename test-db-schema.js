require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testForgotPassword() {
  try {
    // Check if password_reset columns exist
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name LIKE 'password_reset%'
    `);
    
    console.log('✅ Database Schema Check:');
    console.log('Password reset columns found:', columns.rows.length);
    columns.rows.forEach(row => console.log('  -', row.column_name));
    
    // Check if user exists
    const user = await pool.query(
      'SELECT id, email FROM users WHERE email = $1 LIMIT 1',
      ['lovetofly.ed@gmail.com']
    );
    
    console.log('\n✅ User Check:');
    if (user.rows.length > 0) {
      console.log('  Found user:', user.rows[0].email);
    } else {
      console.log('  No user found with this email');
      
      // List all users
      const allUsers = await pool.query('SELECT id, email FROM users LIMIT 5');
      console.log('\n  Available users:');
      allUsers.rows.forEach(u => console.log('    -', u.email));
    }
    
    pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
    process.exit(1);
  }
}

testForgotPassword();
