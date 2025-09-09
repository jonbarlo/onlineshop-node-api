const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// CRITICAL: Use exact working dotenv pattern for Mochahost
let dotenvResult = null;
let envPath = null;

try {
  envPath = path.resolve(__dirname, '.env');
  dotenvResult = dotenv.config({ path: envPath });
  console.log('Dotenv loaded successfully');
} catch (error) {
  console.error('Dotenv loading failed:', error);
}

// Initialize Prisma with error handling
let prisma = null;
let dbConnected = false;

try {
  prisma = new PrismaClient({
    log: ['error'],
    errorFormat: 'pretty',
  });
  console.log('Prisma client initialized');
} catch (error) {
  console.error('Prisma initialization failed:', error);
}

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API Routes Test is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Database connection test endpoint
app.get('/test-db', async (req, res) => {
  try {
    if (!prisma) {
      return res.status(500).json({
        error: 'Prisma client not initialized',
        dotenvLoaded: !!dotenvResult,
        envPath: envPath,
        dotenvError: dotenvResult?.error || null,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        timestamp: new Date().toISOString()
      });
    }

    await prisma.$connect();
    dbConnected = true;

    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    res.json({
      status: 'SUCCESS',
      message: 'Database connection successful',
      dotenvLoaded: !!dotenvResult,
      envPath: envPath,
      dotenvError: dotenvResult?.error || null,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      dbConnected: dbConnected,
      testQuery: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      error: 'Database connection failed',
      message: error.message,
      dotenvLoaded: !!dotenvResult,
      envPath: envPath,
      dotenvError: dotenvResult?.error || null,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      dbConnected: dbConnected,
      timestamp: new Date().toISOString()
    });
  }
});

// AUTH ROUTES
// Admin login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (!prisma) {
      return res.status(500).json({ error: 'Database not available' });
    }

    // Find admin user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

// PRODUCT ROUTES
// Get all products
app.get('/api/products', async (req, res) => {
  try {
    if (!prisma) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        imageUrl: true,
        createdAt: true
      }
    });

    res.json({
      message: 'Products retrieved successfully',
      products,
      count: products.length
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to retrieve products', message: error.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    if (!prisma) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        imageUrl: true,
        createdAt: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product retrieved successfully',
      product
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to retrieve product', message: error.message });
  }
});

// ADMIN ROUTES (protected)
// Create product
app.post('/api/admin/products', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, stock, imageUrl } = req.body;

    if (!name || !description || !price || stock === undefined) {
      return res.status(400).json({ error: 'Name, description, price, and stock are required' });
    }

    if (!prisma) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        imageUrl: imageUrl || null,
        isActive: true
      }
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl,
        createdAt: product.createdAt
      }
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product', message: error.message });
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'API Routes Test',
    dotenvLoaded: !!dotenvResult,
    envPath: envPath,
    dotenvError: dotenvResult?.error || null,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
    prismaInitialized: !!prisma,
    endpoints: [
      'GET /health',
      'GET /test-db', 
      'POST /api/auth/login',
      'GET /api/products',
      'GET /api/products/:id',
      'POST /api/admin/products (protected)'
    ],
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'API Routes Test',
    version: '1.0.0',
    endpoints: ['/health', '/test', '/test-db', '/api/auth/login', '/api/products', '/api/admin/products'],
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

// Start server - use exact working pattern
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API Routes Test running on port ${port}`);
});

module.exports = app;
