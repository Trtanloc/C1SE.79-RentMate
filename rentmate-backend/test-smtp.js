// test-smtp.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'phatdh7c@gmail.com',
    pass: 'vdcmklrhwnmhxomo', // App Password của bạn
  },
});

async function test() {
  try {
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    const info = await transporter.sendMail({
      from: '"RentMate" <phatdh7c@gmail.com>',
      to: 'phatdh7c@gmail.com',
      subject: 'Direct Test Email',
      text: 'This is a direct test from Node.js',
      html: '<p>This is a <b>direct test</b> from Node.js</p>',
    });
    
    console.log('✅ Email sent! Message ID:', info.messageId);
    console.log('📧 Please check your Gmail inbox and spam folder');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error response:', error.response);
  }
}

test();