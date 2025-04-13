// lib/email/sendPasswordResetEmail.ts
import nodemailer from 'nodemailer';

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Create reset URL
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  // Email content
  const mailOptions = {
    from: `"RCMS System" <${process.env.EMAIL_FROM || 'BASIT_IQBAL@rcms.com'}>`,
    to: email,
    subject: 'Reset Your Password',
    text: `Hello ${name},\n\nYou requested to reset your password. Please click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nRegards,\nRCMS System Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>Hello ${name},</p>
        <p>You requested to reset your password. Please click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Regards,<br>RCMS System Team</p>
      </div>
    `
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);
  
  console.log('Password reset email sent: %s', info.messageId);
  
  return info;
}