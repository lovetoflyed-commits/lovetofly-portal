const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Master@51@localhost:5432/lovetofly-portal'
});

(async () => {
  try {
    // Update user ID 6 to master
    const updateResult = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role',
      ['master', 6]
    );
    
    if (updateResult.rows.length > 0) {
      const user = updateResult.rows[0];
      console.log('\n✅ Role Updated Successfully!\n');
      console.log('   User: ' + user.email);
      console.log('   New Role: 👑 ' + user.role);
    }
    
    // Show both master users now
    const result = await pool.query(
      "SELECT id, email, role FROM users WHERE role = 'master' ORDER BY id"
    );
    
    console.log('\n📋 Master Admin Users Now:\n');
    result.rows.forEach(user => {
      console.log('   👑 ID: ' + user.id + ', Email: ' + user.email + ', Role: ' + user.role);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await pool.end();
})();
