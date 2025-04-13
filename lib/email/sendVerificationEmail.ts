import nodemailer from 'nodemailer';

export async function sendVerificationEmail(email: string, token: string, name: string) {
  
  let testAccount, transporter;

  
    // Development email configuration using gmail
    // testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  

  // Create verification URL
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  // Email content
  const mailOptions = {
    from: `"RCMS System" <${process.env.EMAIL_FROM || 'BASIT_IQBAL@rcms.com'}>`,
    to: email,
    subject: 'Verify Your Email Address',
    text: `Hello ${name},\n\nPlease verify your email address by clicking on the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nRegards,\nRCMS System Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering with RCMS System. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
        </div>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>Regards,<br>RCMS System Team</p>
      </div>
    `
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);

  
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  

  return info;
}



