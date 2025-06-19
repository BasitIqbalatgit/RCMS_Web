// lib/email/sendPasswordResetEmail.ts
import nodemailer, { SentMessageInfo } from 'nodemailer';

export async function sendPasswordResetEmail(email: string, token: string, name: string): Promise<SentMessageInfo> {
  let transporter: nodemailer.Transporter | null = null;

  try {
    // Check if we're in development mode and should use a test account
    if (process.env.NODE_ENV === 'development' && !process.env.EMAIL) {
      console.log('Development mode: Using test email account for password reset');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } else {
      // Production Gmail SMTP configurations with better error handling
      const gmailConfigs = [
        {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false, // TLS
          auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
          },
          connectionTimeout: 60000, // 60 seconds
          greetingTimeout: 30000,   // 30 seconds
          socketTimeout: 60000,     // 60 seconds
          tls: {
            rejectUnauthorized: false
          }
        },
        {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true, // SSL
          auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
          },
          connectionTimeout: 60000,
          greetingTimeout: 30000,
          socketTimeout: 60000
        },
        {
          service: 'gmail', // Let nodemailer handle the configuration
          auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
          },
          connectionTimeout: 60000,
          greetingTimeout: 30000,
          socketTimeout: 60000
        }
      ];

      // Try each configuration
      for (const config of gmailConfigs) {
        try {
          console.log(`Trying email config for password reset: ${config.host || config.service}:${config.port}`);
          transporter = nodemailer.createTransport(config);
          
          // Test the connection with timeout
          await Promise.race([
            transporter.verify(),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Connection timeout')), 30000)
            )
          ]);
          
          console.log('Password reset email transporter verified successfully with config:', config.host || config.service);
          break;
        } catch (error: any) {
          console.log(`Failed with config ${config.host || config.service}:`, error.message);
          transporter = null; // Reset transporter on failure
          continue;
        }
      }
    }

    // Check if transporter was successfully created
    if (!transporter) {
      throw new Error('All email configurations failed - unable to create transporter for password reset');
    }

    // Create reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Email content
    const mailOptions = {
      from: `"RCMS System" <${process.env.EMAIL || 'noreply@rcms.com'}>`,
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

    // Send email with timeout
    const info = await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Email send timeout')), 30000)
      )
    ]) as SentMessageInfo;

    console.log('Password reset email sent successfully:', info.messageId);
    
    // If using test account, log the preview URL
    if (process.env.NODE_ENV === 'development' && !process.env.EMAIL) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return info;

  } catch (error: any) {
    console.error('Password reset email sending failed:', error);
    throw error;
  }
}