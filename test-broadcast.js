#!/usr/bin/env node

const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_ID = '11111111-1111-1111-1111-111111111111';

// Create a token for the admin user
const token = jwt.sign(
  {
    id: ADMIN_ID,
    userId: ADMIN_ID,
    email: 'admin@lovetofly.com.br',
    role: 'admin',
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

console.log('Generated token:', token);

// Test the broadcast API
async function testBroadcast() {
  const payload = {
    module: 'admin',
    subject: 'Test Broadcast Message',
    message: 'This is a test broadcast message sent at ' + new Date().toISOString(),
    priority: 'normal',
    targetFilter: 'all_users',
  };

  console.log('\nTesting broadcast endpoint...');
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/admin/messages/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.status === 200) {
      console.log('\n✅ Broadcast sent successfully!');
      console.log(`Sent to ${result.data?.sentCount || 0} users`);
    } else {
      console.log('\n❌ Broadcast failed');
    }
  } catch (error) {
    console.error('❌ Error testing broadcast:', error.message);
  }
}

testBroadcast();
