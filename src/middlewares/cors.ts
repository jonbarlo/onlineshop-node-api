import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Simple CORS configuration
const corsOptions = {
  origin: [
    'https://shop.506software.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
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
