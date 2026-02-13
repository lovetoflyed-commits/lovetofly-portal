const fetch = require('node-fetch');

async function testReplyAPI() {
  try {
    // 1. Login as user to get token
    console.log('🔐 Logging in as user (carlos)...\n');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'carlos@lovetofly.com.br',
        password: 'Carlos@123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const userToken = loginData.data.token;
    console.log('✅ User logged in successfully\n');

    // 2. User sends a reply to message ID 3 (which is from user to admin)
    // Actually, let's reply to message 4 (admin's reply), so user sends another reply back
    console.log('📤 User sending reply to message ID 4...\n');
    const replyResponse = await fetch('http://localhost:3000/api/messages/4/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        message: 'Esta é uma resposta do usuário para a mensagem do admin via API!'
      })
    });

    if (!replyResponse.ok) {
      console.log('❌ Reply failed:', replyResponse.status, await replyResponse.text());
      return;
    }

    const replyData = await replyResponse.json();
    console.log('✅ Reply created via API:', replyData);
    console.log('\n📊 Check the server console for [REPLY DEBUG] logs to see the calculated recipientUserId\n');

    // 3. Now login as admin and check inbox
    console.log('🔐 Logging in as admin...\n');
    const adminLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@lovetofly.com.br',
        password: 'Admin@123'
      })
    });

    if (!adminLoginResponse.ok) {
      console.log('❌ Admin login failed:', await adminLoginResponse.text());
      return;
    }

    const adminLoginData = await adminLoginResponse.json();
    const adminToken = adminLoginData.data.token;
    console.log('✅ Admin logged in successfully\n');

    // 4. Get admin inbox
    console.log('📥 Fetching admin inbox...\n');
    const inboxResponse = await fetch('http://localhost:3000/api/messages/inbox', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!inboxResponse.ok) {
      console.log('❌ Inbox fetch failed:', await inboxResponse.text());
      return;
    }

    const inboxData = await inboxResponse.json();
    console.log('📨 Admin inbox messages:', inboxData.data.messages.length);
    
    // Find the reply we just sent
    const ourReply = inboxData.data.messages.find(m => m.subject.includes('Esta é uma resposta do usuário'));
    if (ourReply) {
      console.log('✅ Reply appears in admin inbox!');
      console.log(ourReply);
    } else {
      console.log('❌ Reply NOT found in admin inbox');
      console.log('Available messages:', inboxData.data.messages.map(m => ({
        id: m.id,
        subject: m.subject,
        sender: m.sender_user_id
      })));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testReplyAPI();
