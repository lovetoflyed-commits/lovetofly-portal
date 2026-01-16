const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkAdminUser() {
  try {
    // Check for admin users
    const admins = await pool.query(
      `SELECT id, email, role, first_name, last_name 
       FROM users 
       WHERE role IN ('admin', 'staff', 'master')
       ORDER BY id`
    );

    console.log('🔍 Admin/Staff Users:\n');
    if (admins.rows.length === 0) {
      console.log('❌ No admin/staff users found!');
      console.log('\n💡 Creating admin user from first available user...\n');
      
      // Get first user
      const firstUser = await pool.query('SELECT id, email FROM users ORDER BY id LIMIT 1');
      
      if (firstUser.rows.length > 0) {
        const user = firstUser.rows[0];
        await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', user.id]);
        console.log(`✅ Updated user ${user.email} (ID: ${user.id}) to admin role`);
      } else {
        console.log('❌ No users found in database!');
      }
    } else {
      admins.rows.forEach(user => {
        console.log(`  ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.first_name || 'N/A'} ${user.last_name || ''}`);
        console.log(`  Role: ${user.role}`);
        console.log('  ---');
      });
    }

    // Show all users
    const allUsers = await pool.query(
      'SELECT id, email, role FROM users ORDER BY id LIMIT 10'
    );
    
    console.log('\n📋 All Users (first 10):\n');
    allUsers.rows.forEach(user => {
      console.log(`  ${user.id}: ${user.email} (${user.role || 'no role'})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAdminUser();
