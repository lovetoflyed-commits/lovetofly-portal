#!/usr/bin/env node

const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load from .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  debug: true, // Enable debug logging
});

async function testPasswordResetEmail() {
  try {
    console.log('🔐 Password Reset Email Test\n');
    console.log('Configuration:');
    console.log(`  SMTP Host: ${process.env.SMTP_HOST}`);
    console.log(`  SMTP Port: ${process.env.SMTP_PORT}`);
    console.log(`  SMTP User: ${process.env.SMTP_USER}`);
    console.log(`  From Address: ${process.env.SMTP_FROM}`);
    console.log(`  Resend API: ${process.env.RESEND_API_KEY ? 'Configured' : 'Not configured (using SMTP only)'}\n`);
    
    const targetEmail = process.argv[2]?.trim().toLowerCase();

    if (!targetEmail) {
      console.log('❌ Please provide a target email address');
      console.log('Usage: node test-password-reset-email.js user@example.com');
      process.exit(1);
    }

    // Get the specific user from database
    const userQuery = 'SELECT id, email, first_name, last_name FROM users WHERE email = $1 AND deleted_at IS NULL';
    const result = await pool.query(userQuery, [targetEmail]);
    
    if (!result.rows.length) {
      console.log('❌ No users found in database');
      process.exit(1);
    }
    
    const user = result.rows[0];
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    console.log(`✓ Target User: ${user.email} (${fullName})`);
    console.log(`✓ User ID: ${user.id}\n`);
    
    // Generate reset code like the system does
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    console.log(`Generating password reset code...`);
    console.log(`  Reset Code: ${resetCode}`);
    console.log(`  Expires At: ${expiresAt.toISOString()}\n`);
    
    // Update database with reset code (like the API does)
    await pool.query(
      `UPDATE users 
       SET password_reset_code = $1, password_reset_expires = $2 
       WHERE id = $3`,
      [resetCode, expiresAt, user.id]
    );
    console.log('✓ Reset code saved to database\n');
    
    // Prepare email like sendPasswordResetEmail() does
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background: white; padding: 20px; }
    .code-box { background: #f0f0f0; border: 2px solid #2563eb; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0; }
    .code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px; }
    .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Redefinir Senha - Love to Fly</h1>
    </div>
    <div class="content">
      <p>Olá ${fullName},</p>
      <p>Você solicitou para redefinir sua senha na plataforma Love to Fly.</p>
      <p>Seu código de redefinição é:</p>
      <div class="code-box">
        <div class="code">${resetCode}</div>
      </div>
      <p><strong>Este código expira em 15 minutos.</strong></p>
      <p>Se você não solicitou esta redefinição de senha, ignore este email.</p>
      <p>Atenciosamente,<br><strong>Equipe Love to Fly</strong></p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Love to Fly. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
`;

    // Send test email
    console.log('Sending password reset email...\n');
    
    const emailPayload = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Redefinir Senha - Love to Fly',
      html: htmlContent,
    };

    console.log('Email Payload:');
    console.log(`  From: ${emailPayload.from}`);
    console.log(`  To:   ${emailPayload.to}`);
    console.log(`  Subject: ${emailPayload.subject}\n`);

    const info = await transporter.sendMail(emailPayload);
    
    console.log('✅ Email sent successfully!\n');
    console.log('Response Details:');
    console.log(`  Message ID: ${info.messageId || 'N/A'}`);
    console.log(`  Response: ${info.response || 'N/A'}`);
    console.log(`  Accepted: ${info.accepted ? info.accepted.join(', ') : 'N/A'}`);
    console.log(`  Rejected: ${info.rejected && info.rejected.length > 0 ? info.rejected.join(', ') : 'None'}\n`);
    
    console.log('✓ Password reset test email delivered successfully to:', user.email);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull Error Details:');
    console.error(error);
    process.exit(1);
  }
}

testPasswordResetEmail();
