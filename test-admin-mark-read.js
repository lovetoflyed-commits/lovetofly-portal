const fetch = require('node-fetch');

async function testAdminMarkAsRead() {
  try {
    console.log('🧪 Testing Admin Mark Message as Read\n');

    // 1. Login as admin
    console.log('Logging in as admin...');
    const adminLogin = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@lovetofly.com.br',
        password: 'Admin@123'
      })
    });

    if (!adminLogin.ok) {
      console.log('❌ Admin login failed:', await adminLogin.text());
      return;
    }

    const adminData = await adminLogin.json();
    const adminToken = adminData.data.token;
    console.log('✅ Admin logged in\n');

    // 2. Get inbox to find a message
    console.log('Fetching inbox...');
    const inboxResponse = await fetch('http://localhost:3000/api/messages/inbox?limit=1&status=unread', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!inboxResponse.ok) {
      console.log('❌ Inbox fetch failed:', await inboxResponse.text());
      return;
    }

    const inboxData = await inboxResponse.json();
    
    if (inboxData.data.messages.length === 0) {
      console.log('⚠️ No unread messages found. Creating a test message first...\n');
      
      // Create a test message
      const { Pool } = require('pg');
      const pool = new Pool({connectionString: process.env.DATABASE_URL});
      
      const userQuery = await pool.query(`
        SELECT id FROM users WHERE role NOT IN ('admin', 'master') LIMIT 1
      `);
      
      const adminQuery = await pool.query(`
        SELECT id FROM users WHERE role IN ('admin', 'master') LIMIT 1
      `);
      
      if (userQuery.rows.length === 0 || adminQuery.rows.length === 0) {
        console.log('❌ Need at least 1 regular user and 1 admin');
        await pool.end();
        return;
      }
      
      const result = await pool.query(`
        INSERT INTO portal_messages (
          sender_user_id, recipient_user_id, subject, message,
          sender_type, module, is_read
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        userQuery.rows[0].id,
        adminQuery.rows[0].id,
        'Test Message for Admin',
        'This is a test message',
        'user',
        'general',
        false
      ]);
      
      const messageId = result.rows[0].id;
      await pool.end();
      
      console.log(`✅ Created test message with ID: ${messageId}\n`);
      
      // Now try to mark it as read
      console.log(`Marking message ${messageId} as read...`);
      const markResponse = await fetch(`http://localhost:3000/api/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (markResponse.ok) {
        console.log('✅ SUCCESS! Admin can mark any message as read!');
      } else {
        const errorBody = await markResponse.text();
        console.log(`❌ FAILED: ${markResponse.status} - ${errorBody}`);
      }
      
      return;
    }

    const firstMessage = inboxData.data.messages[0];
    console.log(`Found unread message: ID ${firstMessage.id}, Subject: "${firstMessage.subject}"\n`);

    // 3. Mark message as read
    console.log(`Marking message ${firstMessage.id} as read...`);
    const markResponse = await fetch(`http://localhost:3000/api/messages/${firstMessage.id}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (markResponse.ok) {
      console.log('✅ SUCCESS! Message marked as read');
      const responseData = await markResponse.json();
      console.log('Response:', responseData);
    } else {
      const errorBody = await markResponse.text();
      console.log(`❌ FAILED: ${markResponse.status} - ${errorBody}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAdminMarkAsRead();
