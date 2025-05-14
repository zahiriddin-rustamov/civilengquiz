import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

// Create a transporter
const createTransporter = () => {
  // For production, use your actual SMTP config
  if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD) {
    console.log('Creating email transporter with configured settings');
    console.log('Email config debug:', {
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      user: process.env.EMAIL_SERVER_USER,
      // Log first 3 chars of password to verify it's loaded
      pass: process.env.EMAIL_SERVER_PASSWORD ? `${process.env.EMAIL_SERVER_PASSWORD.substring(0, 3)}...` : 'undefined',
      secure: process.env.EMAIL_SERVER_SECURE
    });
    
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || '465'),
        secure: process.env.EMAIL_SERVER_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false
        },
        debug: process.env.NODE_ENV === 'development' // Only enable debug in dev
        });
    return transporter;
  }
  throw new Error('Email server configuration is missing');
};

// Generate verification token
export const generateVerificationToken = (): string => {
  return randomBytes(32).toString('hex');
};

// Send verification email
export const sendVerificationEmail = async (
  email: string, 
  name: string, 
  verificationToken: string
): Promise<boolean> => {
  try {
    console.log(`Sending verification email to ${email} with token ${verificationToken.substring(0, 8)}...`);
    
    // Log configuration for debugging
    console.log('Email configuration:', {
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      secure: process.env.EMAIL_SERVER_SECURE,
      user: process.env.EMAIL_SERVER_USER,
      from: process.env.EMAIL_FROM
    });
    
    // Create email transporter
    const transporter = createTransporter();
    
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify/${verificationToken}`;
    
    // Send the verification email
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Civil Engineering Quiz <no-reply@civilenguaeu.com>',
      to: email,
      subject: 'Verify your email for Civil Engineering Quiz',
      text: `Hello ${name},\n\nPlease verify your email by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't sign up for Civil Engineering Quiz, you can safely ignore this email.\n\nThank you,\nThe Civil Engineering Quiz Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Verify your email address</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with Civil Engineering Quiz. Please verify your email address to activate your account.</p>
          <div style="margin: 20px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't sign up for Civil Engineering Quiz, you can safely ignore this email.</p>
          <hr />
          <p style="color: #666; font-size: 14px;">The Civil Engineering Quiz Team</p>
        </div>
      `
    });
    
    console.log(`Verification email sent successfully to ${email}, messageId: ${result.messageId}`);
    
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}; 