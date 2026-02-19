require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

console.log('Testing SMTP with port 587 (STARTTLS)...\n');
console.log('Configuration:');
console.log('  Host:', process.env.SMTP_HOST);
console.log('  Port:', process.env.SMTP_PORT);
console.log('  Secure:', process.env.SMTP_SECURE);
console.log('  User:', process.env.SMTP_USER);
console.log('  From:', process.env.SMTP_FROM);
console.log('\n');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  logger: true,
  debug: true,
});

// Try to send a test email
transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: process.env.SMTP_USER,
  subject: 'LoveToFly SMTP Port 587 Test',
  text: 'If you see this, SMTP with port 587 is working!',
}, (error, info) => {
  if (error) {
    console.error('\n❌ SMTP Error:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    if (error.response) {
      console.error('  Response:', error.response);
    }
    process.exit(1);
  } else {
    console.log('\n✅ Email sent successfully!');
    console.log('  Message ID:', info.messageId);
    process.exit(0);
  }
});

// Set a timeout to exit if the connection hangs
setTimeout(() => {
  console.error('\n⏱️ Timeout: SMTP connection took too long. Exiting...');
  process.exit(1);
}, 15000);
