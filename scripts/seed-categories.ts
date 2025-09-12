import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleCategories = [
  {
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    slug: 'electronics',
    sortOrder: 1
  },
  {
    name: 'Clothing',
    description: 'Apparel and fashion items',
    slug: 'clothing',
    sortOrder: 2
  },
  {
    name: 'Home & Garden',
    description: 'Home improvement and garden supplies',
    slug: 'home-garden',
    sortOrder: 3
  },
  {
    name: 'Sports & Outdoors',
    description: 'Sports equipment and outdoor gear',
    slug: 'sports-outdoors',
    sortOrder: 4
  },
  {
    name: 'Books',
    description: 'Books and educational materials',
    slug: 'books',
    sortOrder: 5
  },
  {
    name: 'Toys & Games',
    description: 'Toys, games, and entertainment',
    slug: 'toys-games',
    sortOrder: 6
  }
];

async function seedCategories() {
  try {
    console.log('🌱 Seeding categories...');
    
    for (const categoryData of sampleCategories) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          OR: [
            { name: categoryData.name },
            { slug: categoryData.slug }
          ]
        }
      });

      if (!existingCategory) {
        const category = await prisma.category.create({
          data: categoryData
        });
        console.log(`✅ Created category: ${category.name} (${category.slug})`);
      } else {
        console.log(`⏭️  Category already exists: ${categoryData.name}`);
      }
    }

    console.log('🎉 Categories seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories();
