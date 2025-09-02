import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@simpleshop.com',
      passwordHash: hashedPassword,
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', { id: adminUser.id, username: adminUser.username });

  // Create sample products
  const sampleProducts = [
    {
      name: 'Sample Product 1',
      description: 'This is a sample product description for testing purposes.',
      price: 29.99,
      imageUrl: 'https://via.placeholder.com/300x300?text=Product+1',
    },
    {
      name: 'Sample Product 2',
      description: 'Another sample product with a longer description to test the system.',
      price: 49.99,
      imageUrl: 'https://via.placeholder.com/300x300?text=Product+2',
    },
    {
      name: 'Sample Product 3',
      description: 'A third sample product for comprehensive testing.',
      price: 19.99,
      imageUrl: 'https://via.placeholder.com/300x300?text=Product+3',
    },
  ];

  for (const product of sampleProducts) {
    const createdProduct = await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: product,
    });
    console.log('✅ Product created:', { id: createdProduct.id, name: createdProduct.name });
  }

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
