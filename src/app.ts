import express from 'express';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { config } from '@/config';
import { corsMiddleware, corsHandler } from '@/middlewares/cors';
import { errorHandler, notFoundHandler } from '@/middlewares/error';
import logger from '@/utils/logger';

// Import routes
import authRoutes from '@/api/auth';
import productRoutes from '@/api/products';
import orderRoutes from '@/api/orders';
import adminRoutes from '@/api/admin';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS middleware
app.use(corsMiddleware);
app.use(corsHandler);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (for uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'SimpleShop API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'SimpleShop API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
