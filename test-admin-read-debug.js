/**
 * Test script to debug admin marking message as read
 */

const fetch = require('node-fetch');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.argv[2]; // Pass admin token as argument
const MESSAGE_ID = process.argv[3]; // Pass message ID as argument

if (!ADMIN_TOKEN) {
  console.error('USAGE: node test-admin-read-debug.js <ADMIN_TOKEN> <MESSAGE_ID>');
  console.error('Example: node test-admin-read-debug.js eyJhbGc... 123');
  process.exit(1);
}

if (!MESSAGE_ID) {
  console.error('MESSAGE_ID required');
  process.exit(1);
}

async function testReadEndpoint() {
  console.log('\n🔍 Testing Admin Read Endpoint...\n');
  console.log('Base URL:', BASE_URL);
  console.log('Message ID:', MESSAGE_ID);
  console.log('Token (first 20 chars):', ADMIN_TOKEN.substring(0, 20) + '...\n');

  try {
    // Test 1: Mark message as read
    console.log('📌 Test 1: Marking message as read');
    const readResponse = await fetch(`${BASE_URL}/api/messages/${MESSAGE_ID}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', readResponse.status, readResponse.statusText);
    
    const readBody = await readResponse.text();
    console.log('Response:', readBody);

    if (readResponse.ok) {
      console.log('✅ Success: Message marked as read');
    } else {
      console.log('❌ Failed: Got status', readResponse.status);
      console.log('Response body:', readBody);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run tests
testReadEndpoint();
