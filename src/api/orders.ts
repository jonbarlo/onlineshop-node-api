import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { CreateOrderRequest, OrderResponse, ORDER_STATUS } from '../types/order';
import { ApiResponse } from '../types/api';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, HTTP_STATUS } from '../utils/constants';
import { asyncHandler } from '../middlewares/error';
import { validateCreateOrder } from '../middlewares/validation';

const router = Router();

// Helper function to find or create product variant
async function findOrCreateProductVariant(productId: number, color?: string, size?: string) {
  // If no color/size specified, return null (use product-level inventory)
  if (!color || !size) {
    return null;
  }

  // Try to find existing variant
  let variant = await prisma.productVariant.findFirst({
    where: {
      productId,
      color,
      size,
      isActive: true,
    },
  });

  // If variant doesn't exist, create it with 0 quantity
  if (!variant) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true }
    });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Generate SKU: PRODUCT-NAME-COLOR-SIZE (simplified)
    const sku = `${product.name.toUpperCase().replace(/\s+/g, '-')}-${color.toUpperCase()}-${size.toUpperCase()}`;
    
    variant = await prisma.productVariant.create({
      data: {
        productId,
        color,
        size,
        quantity: 0, // Start with 0 inventory
        sku,
        isActive: true,
      },
    });
  }

  return variant;
}

// POST /api/orders - Create new order
router.post('/', validateCreateOrder, asyncHandler(async (req: Request<{}, ApiResponse<OrderResponse>, CreateOrderRequest>, res: Response<ApiResponse<OrderResponse>>) => {
  const { customerName, customerEmail, customerPhone, deliveryAddress, items } = req.body;

  // Validate that all products exist and are active
  const productIds = items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
      status: 'available',
    },
  });

  if (products.length !== productIds.length) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.PRODUCT_NOT_FOUND,
      error: 'One or more products not found, inactive, or sold out',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Process each item and check inventory
  const processedItems: any[] = [];
  let totalAmount = 0;

  for (const item of items) {
    const product = products.find((p: any) => p.id === item.productId);
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found`);
    }

    const unitPrice = Number(product.price);
    const itemTotal = unitPrice * item.quantity;
    totalAmount += itemTotal;

    // Find or create variant if color/size specified
    let variant = null;
    if (item.selectedColor && item.selectedSize) {
      variant = await findOrCreateProductVariant(item.productId, item.selectedColor, item.selectedSize);
      
      // Check variant inventory
      if (variant && variant.quantity < item.quantity) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Insufficient inventory',
          error: `Product "${product.name}" in ${item.selectedColor} ${item.selectedSize} only has ${variant.quantity} units available, but ${item.quantity} were requested`,
          timestamp: new Date().toISOString(),
        });
        return;
      }
    } else {
      // Check product-level inventory for items without variants
      if (product.quantity < item.quantity) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Insufficient inventory',
          error: `Product "${product.name}" only has ${product.quantity} units available, but ${item.quantity} were requested`,
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    processedItems.push({
      productId: item.productId,
      productVariantId: variant?.id || null,
      quantity: item.quantity,
      unitPrice,
      selectedColor: item.selectedColor || null,
      selectedSize: item.selectedSize || null,
    });
  }

  // Generate unique order number
  const orderNumber = `SS-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

  // Create order with items in a transaction
  const order = await prisma.$transaction(async (tx: any) => {
    // Create the order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        status: ORDER_STATUS.NEW,
        totalAmount,
        items: {
          create: processedItems,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
            productVariant: {
              select: {
                id: true,
                color: true,
                size: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    return newOrder;
  });

  // Format response
  const orderResponse: OrderResponse = {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    items: order.items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      product: {
        id: item.product.id,
        name: item.product.name,
        imageUrl: item.product.imageUrl || undefined,
      },
      productVariant: item.productVariant ? {
        id: item.productVariant.id,
        color: item.productVariant.color,
        size: item.productVariant.size,
        sku: item.productVariant.sku,
      } : undefined,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.ORDER_CREATED,
    data: orderResponse,
    timestamp: new Date().toISOString(),
  });
}));

export default router;
