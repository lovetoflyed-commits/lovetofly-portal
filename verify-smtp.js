require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

console.log('✅ SMTP Config Verification:');
console.log('Host:', process.env.SMTP_HOST);
console.log('Port:', process.env.SMTP_PORT);  
console.log('Secure:', process.env.SMTP_SECURE);
console.log('User:', process.env.SMTP_USER);
console.log('From:', process.env.SMTP_FROM);
console.log('\n📧 Testing SMTP...\n');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: 'lovetofly.ed@gmail.com',
  subject: 'Password Reset Test - Port 587',
  text: 'Your password reset code is: 123456',
}, (error, info) => {
  if (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Success! Code sent.');
    process.exit(0);
  }
});

setTimeout(() => {
  console.error('⏱️ Timeout');
  process.exit(1);
}, 12000);
