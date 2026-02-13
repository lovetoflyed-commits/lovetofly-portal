const fetch = require('node-fetch');

async function testAdminAPI() {
  try {
    console.log('🔐 Testing Admin API Access\n');

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

    // 2. Get admin inbox (should show ALL messages)
    console.log('📥 Fetching Admin Inbox (should see ALL messages)...');
    const inboxResponse = await fetch('http://localhost:3000/api/messages/inbox?limit=50', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!inboxResponse.ok) {
      console.log('❌ Inbox fetch failed:', await inboxResponse.text());
      return;
    }

    const inboxData = await inboxResponse.json();
    console.log(`Found ${inboxData.data.messages.length} messages in inbox`);
    console.log('Subjects:');
    inboxData.data.messages.forEach(m => {
      console.log(`  - ${m.subject} (from ${m.sender_name || 'Unknown'})`);
    });

    // 3. Get admin sent (should show ALL messages)
    console.log('\n📤 Fetching Admin Sent (should see ALL messages)...');
    const sentResponse = await fetch('http://localhost:3000/api/messages/sent?limit=50', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!sentResponse.ok) {
      console.log('❌ Sent fetch failed:', await sentResponse.text());
      return;
    }

    const sentData = await sentResponse.json();
    console.log(`Found ${sentData.data.messages.length} messages in sent`);
    console.log('Subjects:');
    sentData.data.messages.forEach(m => {
      console.log(`  - ${m.subject} (to ${m.recipient_name || 'Unknown'})`);
    });

    // 4. Login as user1
    console.log('\n🔐 Logging in as user1...');
    const user1Login = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'carlos@lovetofly.com.br',
        password: 'Carlos@123'
      })
    });

    if (!user1Login.ok) {
      console.log('❌ User1 login failed:', await user1Login.text());
      return;
    }

    const user1Data = await user1Login.json();
    const user1Token = user1Data.data.token;
    console.log('✅ User1 logged in\n');

    // 5. Get user1 inbox (should only show their messages)
    console.log('📥 Fetching User1 Inbox (should only see messages TO user1)...');
    const user1InboxResponse = await fetch('http://localhost:3000/api/messages/inbox?limit=50', {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });

    if (!user1InboxResponse.ok) {
      console.log('❌ User1 inbox fetch failed:', await user1InboxResponse.text());
      return;
    }

    const user1InboxData = await user1InboxResponse.json();
    console.log(`Found ${user1InboxData.data.messages.length} messages in inbox`);
    console.log('Subjects:');
    user1InboxData.data.messages.forEach(m => {
      console.log(`  - ${m.subject} (from ${m.sender_name || 'Unknown'})`);
    });

    // 6. Get user1 sent (should only show their messages)
    console.log('\n📤 Fetching User1 Sent (should only see messages FROM user1)...');
    const user1SentResponse = await fetch('http://localhost:3000/api/messages/sent?limit=50', {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });

    if (!user1SentResponse.ok) {
      console.log('❌ User1 sent fetch failed:', await user1SentResponse.text());
      return;
    }

    const user1SentData = await user1SentResponse.json();
    console.log(`Found ${user1SentData.data.messages.length} messages in sent`);
    console.log('Subjects:');
    user1SentData.data.messages.forEach(m => {
      console.log(`  - ${m.subject} (to ${m.recipient_name || 'Unknown'})`);
    });

    console.log('\n✅ Test completed!');
    console.log(`\nSummary:`);
    console.log(`- Admin inbox: ${inboxData.data.messages.length} messages (should be ALL messages)`);
    console.log(`- Admin sent: ${sentData.data.messages.length} messages (should be ALL messages)`);
    console.log(`- User1 inbox: ${user1InboxData.data.messages.length} messages (should be only TO user1)`);
    console.log(`- User1 sent: ${user1SentData.data.messages.length} messages (should be only FROM user1)`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAdminAPI();
