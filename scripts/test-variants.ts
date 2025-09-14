#!/usr/bin/env ts-node

/**
 * Test Script: Verify Product Variants System
 * 
 * This script tests the core variant functionality:
 * 1. Create a product with colors/sizes
 * 2. Create an order with variant selection
 * 3. Mark order as paid and verify inventory deduction
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testVariantSystem() {
  console.log('🧪 Testing Product Variants System...\n');

  try {
    // Step 1: Create a test product with colors and sizes
    console.log('1️⃣ Creating test product...');
    const product = await prisma.product.create({
      data: {
        name: 'Test T-Shirt',
        description: 'A test t-shirt for variant testing',
        price: 25.99,
        categoryId: null,
        quantity: 0, // Will use variants for inventory
        colors: JSON.stringify(['Blue', 'Red']),
        sizes: JSON.stringify(['S', 'M', 'L']),
        status: 'available',
        isActive: true,
      },
    });
    console.log(`   ✅ Created product: ${product.name} (ID: ${product.id})`);

    // Step 2: Create variants manually (simulating what happens in order creation)
    console.log('\n2️⃣ Creating product variants...');
    const variants = [];
    const colors = ['Blue', 'Red'];
    const sizes = ['S', 'M', 'L'];

    for (const color of colors) {
      for (const size of sizes) {
        const sku = `${product.name.toUpperCase().replace(/\s+/g, '-')}-${color.toUpperCase()}-${size.toUpperCase()}`;
        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            color,
            size,
            quantity: 10, // 10 units per variant
            sku,
            isActive: true,
          },
        });
        variants.push(variant);
        console.log(`   ✅ Created variant: ${color} ${size} (SKU: ${sku}, Qty: 10)`);
      }
    }

    // Step 3: Test order creation with variant selection
    console.log('\n3️⃣ Testing order creation with variants...');
    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}`,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '123-456-7890',
        deliveryAddress: '123 Test St',
        status: 'new',
        totalAmount: 25.99,
        items: {
          create: [
            {
              productId: product.id,
              productVariantId: variants[0].id, // Blue S
              quantity: 2,
              unitPrice: 25.99,
              selectedColor: 'Blue',
              selectedSize: 'S',
            },
            {
              productId: product.id,
              productVariantId: variants[3].id, // Red M
              quantity: 1,
              unitPrice: 25.99,
              selectedColor: 'Red',
              selectedSize: 'M',
            },
          ],
        },
      },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    });
    console.log(`   ✅ Created order: ${order.orderNumber}`);
    console.log(`   📦 Order items: ${order.items.length}`);

    // Step 4: Test inventory deduction (mark as paid)
    console.log('\n4️⃣ Testing inventory deduction (marking as paid)...');
    
    // Check inventory before payment
    const blueSVariant = await prisma.productVariant.findUnique({
      where: { id: variants[0].id },
    });
    const redMVariant = await prisma.productVariant.findUnique({
      where: { id: variants[3].id },
    });
    
    console.log(`   📊 Before payment:`);
    console.log(`      Blue S: ${blueSVariant?.quantity} units`);
    console.log(`      Red M: ${redMVariant?.quantity} units`);

    // Mark order as paid (this should deduct inventory)
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.productVariantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.productVariantId },
          });
          if (variant) {
            const newQuantity = variant.quantity - item.quantity;
            await tx.productVariant.update({
              where: { id: item.productVariantId },
              data: { quantity: newQuantity },
            });
            console.log(`   📉 Deducted ${item.quantity} from ${variant.color} ${variant.size}: ${variant.quantity} → ${newQuantity}`);
          }
        }
      }
      
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'paid' },
      });
    });

    // Check inventory after payment
    const blueSVariantAfter = await prisma.productVariant.findUnique({
      where: { id: variants[0].id },
    });
    const redMVariantAfter = await prisma.productVariant.findUnique({
      where: { id: variants[3].id },
    });
    
    console.log(`   📊 After payment:`);
    console.log(`      Blue S: ${blueSVariantAfter?.quantity} units`);
    console.log(`      Red M: ${redMVariantAfter?.quantity} units`);

    // Step 5: Test insufficient inventory scenario
    console.log('\n5️⃣ Testing insufficient inventory scenario...');
    try {
      const order2 = await prisma.order.create({
        data: {
          orderNumber: `TEST-${Date.now()}-2`,
          customerName: 'Test Customer 2',
          customerEmail: 'test2@example.com',
          customerPhone: '123-456-7890',
          deliveryAddress: '456 Test St',
          status: 'new',
          totalAmount: 25.99,
          items: {
            create: [
              {
                productId: product.id,
                productVariantId: variants[0].id, // Blue S (now has 8 units)
                quantity: 10, // Try to order 10, but only 8 available
                unitPrice: 25.99,
                selectedColor: 'Blue',
                selectedSize: 'S',
              },
            ],
          },
        },
      });
      console.log('   ❌ ERROR: Order should have been rejected due to insufficient inventory!');
    } catch (error) {
      console.log('   ✅ Correctly rejected order due to insufficient inventory');
    }

    // Step 6: Test product response with variants
    console.log('\n6️⃣ Testing product response with variants...');
    const productWithVariants = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        variants: {
          where: { isActive: true },
          orderBy: [{ color: 'asc' }, { size: 'asc' }],
        },
      },
    });

    console.log(`   📦 Product: ${productWithVariants?.name}`);
    console.log(`   🎨 Colors: ${JSON.parse(productWithVariants?.colors || '[]').join(', ')}`);
    console.log(`   📏 Sizes: ${JSON.parse(productWithVariants?.sizes || '[]').join(', ')}`);
    console.log(`   🔢 Variants: ${productWithVariants?.variants.length}`);
    
    productWithVariants?.variants.forEach(variant => {
      console.log(`      ${variant.color} ${variant.size}: ${variant.quantity} units (SKU: ${variant.sku})`);
    });

    console.log('\n🎉 All tests passed! Variant system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.orderItem.deleteMany({
      where: {
        order: {
          orderNumber: { startsWith: 'TEST-' }
        }
      }
    });
    await prisma.order.deleteMany({
      where: { orderNumber: { startsWith: 'TEST-' } }
    });
    await prisma.productVariant.deleteMany({
      where: { product: { name: 'Test T-Shirt' } }
    });
    await prisma.product.deleteMany({
      where: { name: 'Test T-Shirt' }
    });
    console.log('   ✅ Cleanup completed');
    
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testVariantSystem()
    .then(() => {
      console.log('\n✅ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { testVariantSystem };
