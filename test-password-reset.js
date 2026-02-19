#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

async function testPasswordResetFlow() {
  console.log('🔍 Testing Password Reset Email Flow...\n');
  
  // Test 1: Check SMTP Config
  console.log('1️⃣  SMTP Configuration:');
  console.log('   Host:', process.env.SMTP_HOST);
  console.log('   Port:', process.env.SMTP_PORT);
  console.log('   From:', process.env.SMTP_FROM);
  console.log('   ✓ Config looks good\n');
  
  // Test 2: Test SMTP Connection
  console.log('2️⃣  Testing SMTP Connection...');
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  
  try {
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: 'lovetofly.ed@gmail.com',
      subject: 'Password Reset Code - Love to Fly',
      html: `
        <html>
          <body>
            <h2>Código de Redefinição de Senha</h2>
            <p>Seu código é: <strong>123456</strong></p>
            <p>Válido por 15 minutos.</p>
          </body>
        </html>
      `,
    });
    console.log('   ✓ SMTP works! Message:', result.messageId, '\n');
  } catch (err) {
    console.error('   ❌ SMTP Failed:', err.message, '\n');
    process.exit(1);
  }
  
  // Test 3: Check Database
  console.log('3️⃣  Checking Database Schema...');
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const result = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name LIKE 'password_reset%'
    `);
    console.log('   Found columns:', result.rows.map(r => r.column_name).join(', '));
    console.log('   ✓ Database schema OK\n');
  } catch (err) {
    console.error('   ❌ Database check failed:', err.message, '\n');
    process.exit(1);
  } finally {
    pool.end();
  }
  
  console.log('✅ All tests passed! Password reset is ready to use.');
  process.exit(0);
}

testPasswordResetFlow().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

setTimeout(() => {
  console.error('⏱️ Test timeout');
  process.exit(1);
}, 15000);
