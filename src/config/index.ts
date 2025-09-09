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

export const config = {
  // Server Configuration
  port: process.env.PORT ? parseInt(process.env.PORT) : undefined,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  
  // Admin Configuration
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    email: process.env.ADMIN_EMAIL || 'admin@simpleshop.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  
  // File Upload Configuration
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(','),
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
};

export default config;
