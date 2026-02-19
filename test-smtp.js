const nodemailer = require('nodemailer');
require('dotenv').config();

async function testSMTP() {
  console.log('📧 Testing SMTP Connection...');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('Secure:', process.env.SMTP_SECURE);
  console.log('User:', process.env.SMTP_USER);
  console.log('---');

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
    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection verified!');

    // Try sending a test email
    console.log('\nSending test email...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER, // Send to self
      subject: 'LoveToFly SMTP Test',
      html: '<h1>SMTP Test</h1><p>If you receive this, SMTP is working!</p>',
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP Error:', error.message);
    console.error('Code:', error.code);
    console.error('Response:', error.response);
  }

  process.exit(0);
}

testSMTP();
