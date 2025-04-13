import nodemailer from 'nodemailer';

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'malinda.legros@ethereal.email',
      pass: 'hpdk558PjYpFF9nBGH',
    },
  });

  const info = await transporter.sendMail({
    from: '"Test" <test@example.com>',
    to: 'someone@example.com',
    subject: 'Test Email',
    text: 'Testing SMTP connection',
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

testEmail().catch(console.error);
