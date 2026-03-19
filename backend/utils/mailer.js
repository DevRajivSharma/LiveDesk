import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('📧 Mailer config debug:', {
  user: process.env.EMAIL_USER ? 'Present' : 'Missing',
  pass: process.env.EMAIL_PASS ? 'Present' : 'Missing',
  service: process.env.EMAIL_SERVICE
});

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const FROM_EMAIL = process.env.EMAIL_USER;

/**
 * Send OTP for email verification
 */
export const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `"LiveDesk" <${FROM_EMAIL}>`,
    to: email,
    subject: 'Verification Code for LiveDesk',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6366f1; text-align: center;">LiveDesk</h2>
        <p>Your verification code is:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777; text-align: center;">&copy; 2026 LiveDesk Collaboration Tool</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 OTP sent successfully to ${email}`);
    return true;
  } catch (err) {
    console.error('❌ Error sending OTP:', err.message);
    return false;
  }
};

/**
 * Send Password Reset Link
 */
export const sendResetLink = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  const mailOptions = {
    from: `"LiveDesk" <${FROM_EMAIL}>`,
    to: email,
    subject: 'Password Reset Request for LiveDesk',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6366f1; text-align: center;">LiveDesk</h2>
        <p>You requested a password reset. Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #6366f1; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you did not request this, please ignore this email.</p>
        <p>This link is valid for 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777; text-align: center;">&copy; 2026 LiveDesk Collaboration Tool</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Reset link sent successfully to ${email}`);
    return true;
  } catch (err) {
    console.error('❌ Error sending reset link:', err.message);
    return false;
  }
};
