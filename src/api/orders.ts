import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/config/database';
import { CreateOrderRequest, OrderResponse, ORDER_STATUS } from '@/types/order';
import { ApiResponse } from '@/types/api';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, HTTP_STATUS } from '@/utils/constants';
import { asyncHandler } from '@/middlewares/error';
import { validateCreateOrder } from '@/middlewares/validation';

const router = Router();

// POST /api/orders - Create new order
router.post('/', validateCreateOrder, asyncHandler(async (req: Request<{}, ApiResponse<OrderResponse>, CreateOrderRequest>, res: Response<ApiResponse<OrderResponse>>) => {
  const { customerName, customerEmail, customerPhone, deliveryAddress, items } = req.body;

  // Validate that all products exist and are active
  const productIds = items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
  });

  if (products.length !== productIds.length) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.PRODUCT_NOT_FOUND,
      error: 'One or more products not found or inactive',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Calculate total amount
  let totalAmount = 0;
  const orderItems = items.map(item => {
    const product = products.find((p: any) => p.id === item.productId);
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found`);
    }
    
    const unitPrice = Number(product.price);
    const itemTotal = unitPrice * item.quantity;
    totalAmount += itemTotal;

    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
    };
  });

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
          create: orderItems,
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
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      product: {
        id: item.product.id,
        name: item.product.name,
        imageUrl: item.product.imageUrl || undefined,
      },
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
