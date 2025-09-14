import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// CORS configuration with environment variables
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];
  
  // Production domains
  if (process.env['CORS_ALLOWED_ORIGINS']) {
    origins.push(...process.env['CORS_ALLOWED_ORIGINS'].split(',').map(origin => origin.trim()));
  } else {
    // Fallback hardcoded origins for production (temporary fix)
    origins.push(
      'https://shop.506software.com',
      'https://malua.506software.com'
    );
  }
  
  // Development origins (always include in development)
  if (process.env['NODE_ENV'] !== 'production') {
    origins.push(
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173', // Vite dev server
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173' // Vite dev server alternative
    );
  }
  
  return origins;
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

export const corsMiddleware = cors(corsOptions);

export const corsHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  // Let the cors middleware handle everything
  next();
};
