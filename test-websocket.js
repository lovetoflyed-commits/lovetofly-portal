/**
 * WebSocket Local Test Script
 * Run this to test WebSocket connection locally
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const WS_URL = 'ws://localhost:3000/api/ws';

console.log('🧪 WebSocket Local Test Script\n');

// Create a test JWT token
const token = jwt.sign(
  {
    ownerId: 'test-owner-1',
    id: 'test-user-1',
    email: 'test@example.com',
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('✅ JWT Token generated');
console.log(`🔑 Token: ${token.substring(0, 30)}...`);
console.log(`\n🔌 Connecting to: ${WS_URL}\n`);

// Create WebSocket connection
const ws = new WebSocket(WS_URL, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Connection opened
ws.on('open', () => {
  console.log('✅ WebSocket connection established!');
  console.log('📡 Waiting for messages...\n');
});

// Listen for messages
ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Message received:');
    console.log(JSON.stringify(message, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Failed to parse message:', error);
  }
});

// Handle errors
ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

// Handle close
ws.on('close', (code, reason) => {
  console.log(`\n🔌 Connection closed`);
  console.log(`   Code: ${code}`);
  console.log(`   Reason: ${reason || 'No reason provided'}`);
  process.exit(0);
});

// Send a test message after 2 seconds
setTimeout(() => {
  if (ws.readyState === WebSocket.OPEN) {
    console.log('📤 Sending test message...');
    ws.send(
      JSON.stringify({
        type: 'test_message',
        data: { test: 'Hello from client!' },
        timestamp: Date.now(),
      })
    );
  }
}, 2000);

// Keep alive for 30 seconds then close
setTimeout(() => {
  console.log('\n⏱️  Test duration complete, closing connection...');
  ws.close(1000, 'Test complete');
}, 30000);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Closing connection...');
  ws.close(1000, 'User interrupted');
  process.exit(0);
});
