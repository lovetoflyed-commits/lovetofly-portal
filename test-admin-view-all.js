const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testAdminViewAll() {
  try {
    console.log('🧪 Testing Admin View All Messages\n');

    // 1. Get admin and regular users
    const adminQuery = await pool.query(`
      SELECT id, email, role
      FROM users
      WHERE role IN ('admin', 'master')
      ORDER BY role DESC
      LIMIT 1
    `);

    const usersQuery = await pool.query(`
      SELECT id, email, role
      FROM users
      WHERE role NOT IN ('admin', 'master', 'staff')
      LIMIT 2
    `);

    if (adminQuery.rows.length === 0 || usersQuery.rows.length < 2) {
      console.log('❌ Need at least 1 admin and 2 regular users');
      return;
    }

    const admin = adminQuery.rows[0];
    const user1 = usersQuery.rows[0];
    const user2 = usersQuery.rows[1];

    console.log('👥 Users:');
    console.log(`Admin: ${admin.email} (ID: ${admin.id})`);
    console.log(`User1: ${user1.email} (ID: ${user1.id})`);
    console.log(`User2: ${user2.email} (ID: ${user2.id})\n`);

    // 2. Create test messages
    console.log('📨 Creating test messages...\n');

    // User1 -> Admin
    await pool.query(`
      INSERT INTO portal_messages (
        sender_user_id, recipient_user_id, subject, message,
        sender_type, module, is_read
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [user1.id, admin.id, 'User1 to Admin', 'Message 1', 'user', 'general', false]);

    // Admin -> User1
    await pool.query(`
      INSERT INTO portal_messages (
        sender_user_id, recipient_user_id, subject, message,
        sender_type, module, is_read
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [admin.id, user1.id, 'Admin to User1', 'Message 2', 'admin', 'general', false]);

    // User1 -> User2
    await pool.query(`
      INSERT INTO portal_messages (
        sender_user_id, recipient_user_id, subject, message,
        sender_type, module, is_read
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [user1.id, user2.id, 'User1 to User2', 'Message 3', 'user', 'general', false]);

    // User2 -> User1
    await pool.query(`
      INSERT INTO portal_messages (
        sender_user_id, recipient_user_id, subject, message,
        sender_type, module, is_read
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [user2.id, user1.id, 'User2 to User1', 'Message 4', 'user', 'general', false]);

    console.log('✅ Created 4 test messages\n');

    // 3. Count messages by type
    const totalMessages = await pool.query('SELECT COUNT(*) FROM portal_messages');
    console.log(`Total messages in database: ${totalMessages.rows[0].count}\n`);

    // 4. Check what Admin should see (inbox)
    console.log('📥 Admin Inbox (should see ALL received messages):');
    const adminInboxDirect = await pool.query(`
      SELECT subject, sender_user_id, recipient_user_id
      FROM portal_messages
      ORDER BY id DESC
      LIMIT 10
    `);
    
    console.log(`All messages: ${adminInboxDirect.rows.length}`);
    adminInboxDirect.rows.forEach(m => {
      const toAdmin = m.recipient_user_id === admin.id ? ' ← TO ADMIN' : '';
      console.log(`  ${m.subject} (from ${m.sender_user_id.substring(0, 8)}... to ${m.recipient_user_id.substring(0, 8)}...)${toAdmin}`);
    });

    // 5. Check what Admin should see (sent)
    console.log('\n📤 Admin Sent (should see ALL sent messages):');
    const adminSentDirect = await pool.query(`
      SELECT subject, sender_user_id, recipient_user_id
      FROM portal_messages
      ORDER BY id DESC
      LIMIT 10
    `);
    
    console.log(`All messages: ${adminSentDirect.rows.length}`);
    adminSentDirect.rows.forEach(m => {
      const fromAdmin = m.sender_user_id === admin.id ? ' ← FROM ADMIN' : '';
      console.log(`  ${m.subject} (from ${m.sender_user_id.substring(0, 8)}... to ${m.recipient_user_id.substring(0, 8)}...)${fromAdmin}`);
    });

    // 6. Check what User1 should see (inbox - only their messages)
    console.log('\n📥 User1 Inbox (should only see received by User1):');
    const user1Inbox = await pool.query(`
      SELECT subject, sender_user_id, recipient_user_id
      FROM portal_messages
      WHERE recipient_user_id = $1
      ORDER BY id DESC
    `, [user1.id]);
    
    console.log(`User1 inbox: ${user1Inbox.rows.length} messages`);
    user1Inbox.rows.forEach(m => {
      console.log(`  ${m.subject} (from ${m.sender_user_id.substring(0, 8)}...)`);
    });

    // 7. Check what User1 should see (sent - only their messages)
    console.log('\n📤 User1 Sent (should only see sent by User1):');
    const user1Sent = await pool.query(`
      SELECT subject, sender_user_id, recipient_user_id
      FROM portal_messages
      WHERE sender_user_id = $1
      ORDER BY id DESC
    `, [user1.id]);
    
    console.log(`User1 sent: ${user1Sent.rows.length} messages`);
    user1Sent.rows.forEach(m => {
      console.log(`  ${m.subject} (to ${m.recipient_user_id.substring(0, 8)}...)`);
    });

    console.log('\n✅ Test completed. Now test with the API:');
    console.log('1. Login as admin and check /api/messages/inbox (should show ALL received messages)');
    console.log('2. Login as admin and check /api/messages/sent (should show ALL sent messages)');
    console.log('3. Login as user1 and check /api/messages/inbox (should only show messages TO user1)');
    console.log('4. Login as user1 and check /api/messages/sent (should only show messages FROM user1)');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

testAdminViewAll();
