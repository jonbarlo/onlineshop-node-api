import { PrismaClient } from '@prisma/client';
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

// Create Prisma client instance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
export default prisma;
