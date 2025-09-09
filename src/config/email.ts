import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from project root
// CRITICAL: Use __dirname pattern for Mochahost compatibility
try {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  console.log('Environment variables loaded successfully');
} catch (error) {
  console.error('Failed to load environment variables:', error);
}

const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

// Create email transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify connection configuration
transporter.verify((error: any, _success: any) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

export default transporter;

export const emailConfigs = {
  from: process.env.EMAIL_FROM || 'noreply@simpleshop.com',
  managerEmail: process.env.MANAGER_EMAIL || 'manager@simpleshop.com',
};
