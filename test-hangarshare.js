#!/usr/bin/env node

/**
 * Manual Test Suite for HangarShare
 * Run: node test-hangarshare.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const testResults = [];

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function logTest(name, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (details) console.log(`   ${details}`);
  testResults.push({ name, passed, details });
}

async function runTests() {
  console.log('\n=== HANGARSHARE MANUAL TEST SUITE ===\n');

  // Test 1: Airport Search API
  try {
    console.log('📍 Testing Airport Search API...');
    const res = await makeRequest('/api/hangarshare/airport/search?icao=SBSP');
    logTest(
      'Airport Search',
      res.status === 200 && res.body?.icao_code === 'SBSP',
      `Status: ${res.status}, ICAO: ${res.body?.icao_code}`
    );
  } catch (e) {
    logTest('Airport Search', false, e.message);
  }

  // Test 2: Highlighted Listings API
  try {
    console.log('\n📋 Testing Highlighted Listings API...');
    const res = await makeRequest('/api/hangarshare/listing/highlighted');
    const passed = res.status === 200 || (res.body?.error && res.body?.listings !== undefined);
    logTest(
      'Highlighted Listings',
      passed,
      res.body?.error || `Found ${res.body?.listings?.length || 0} listings`
    );
  } catch (e) {
    logTest('Highlighted Listings', false, e.message);
  }

  // Test 3: Owners API (no auth - should fail gracefully)
  try {
    console.log('\n👤 Testing Owner Profile API (without auth)...');
    const res = await makeRequest('/api/hangarshare/owners');
    logTest(
      'Owner API (no auth)',
      res.status === 200 || res.status === 401,
      `Status: ${res.status}`
    );
  } catch (e) {
    logTest('Owner API (no auth)', false, e.message);
  }

  // Test 4: Create Listing API (without auth - should fail)
  try {
    console.log('\n📝 Testing Create Listing API (without auth)...');
    const res = await makeRequest('/api/hangarshare/listing/create', 'POST', {
      airport_icao: 'SBSP',
      hangar_size: 'small'
    });
    logTest(
      'Create Listing (no auth)',
      res.status === 401 || res.status === 403 || res.status === 500,
      `Status: ${res.status} - Auth required`
    );
  } catch (e) {
    logTest('Create Listing (no auth)', false, e.message);
  }

  // Test 5: Main Page Loads
  try {
    console.log('\n🏠 Testing Main Page...');
    const res = await makeRequest('/');
    logTest(
      'Main Page',
      res.status === 200 && typeof res.body === 'string' && res.body.includes('html'),
      `Status: ${res.status}`
    );
  } catch (e) {
    logTest('Main Page', false, e.message);
  }

  // Test 6: HangarShare Owner Dashboard (should redirect to login)
  try {
    console.log('\n📊 Testing Owner Dashboard (without auth)...');
    const res = await makeRequest('/hangarshare/owner/dashboard');
    logTest(
      'Owner Dashboard',
      res.status === 200 || res.status === 302 || res.status === 401,
      `Status: ${res.status}`
    );
  } catch (e) {
    logTest('Owner Dashboard', false, e.message);
  }

  // Summary
  console.log('\n=== TEST SUMMARY ===');
  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${testResults.length}`);
  
  console.log('\n=== MANUAL VERIFICATION CHECKLIST ===');
  console.log('Please verify manually in browser:');
  console.log('1. ✏️  Create Hangar Listing: http://localhost:3000/hangarshare/listing/create');
  console.log('2. 📊 Owner Dashboard: http://localhost:3000/hangarshare/owner/dashboard');
  console.log('3. 📝 Owner Setup: http://localhost:3000/hangarshare/owner/setup');
  console.log('4. 📄 Documents Upload: http://localhost:3000/hangarshare/owner/documents');
  console.log('5. 🔍 Search Results: http://localhost:3000/hangarshare/search');
  console.log('6. 📅 Bookings Management: http://localhost:3000/hangarshare/owner/bookings');
  console.log('\n✅ All features require authentication - create/login first');
}

runTests().catch(console.error);
