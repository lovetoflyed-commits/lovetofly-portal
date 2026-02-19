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
});

async function sendTestEmail() {
  try {
    console.log('📧 Test Email System\n');
    
    // Get a sample user from database
    const userQuery = 'SELECT id, email, first_name, last_name FROM users WHERE deleted_at IS NULL LIMIT 1';
    const result = await pool.query(userQuery);
    
    if (!result.rows.length) {
      console.log('❌ No users found in database');
      process.exit(1);
    }
    
    const user = result.rows[0];
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    console.log(`✓ Found user: ${user.email} (${fullName})`);
    
    // Send test email
    const testEmail = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: '✈️ Love to Fly - Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Love to Fly - Test Email</h2>
          <p>Olá ${fullName || 'Usuário'},</p>
          <p>Este é um email de teste para verificar que o sistema de email está funcionando corretamente.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>✅ Status:</strong> Seu email foi entregue com sucesso!</p>
            <p><strong>🔐 Segurança:</strong> Este email foi assinado com DKIM e autenticado via SPF.</p>
          </div>
          
          <p>Se você recebeu este email, o sistema de notificações está funcionando perfeitamente. Você receberá:</p>
          <ul>
            <li>📧 Redefinições de senha</li>
            <li>📬 Notificações de mensagens</li>
            <li>🔔 Alertas importantes</li>
            <li>✈️ Atualizações da plataforma</li>
          </ul>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Este é um email automatizado. Por favor, não responda.
          </p>
        </div>
      `,
    };
    
    const info = await transporter.sendMail(testEmail);
    
    console.log('\n✅ Test email sent successfully!');
    console.log(`📨 Message ID: ${info.messageId}`);
    console.log(`📧 Recipient: ${user.email}`);
    console.log(`👤 User: ${fullName}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error sending test email:');
    console.error(error.message);
    process.exit(1);
  }
}

sendTestEmail();
