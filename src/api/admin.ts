import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { OrderResponse, OrderSummary, OrderStatus, UpdateOrderStatusRequest, ORDER_STATUS } from '../types/order';
import { ApiResponse, PaginatedResponse } from '../types/api';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, HTTP_STATUS } from '../utils/constants';
import { asyncHandler } from '../middlewares/error';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { validateOrderId, validateUpdateOrderStatus, validatePagination, validateOrderStatusFilter } from '../middlewares/validation';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/orders - List all orders with filtering and pagination
router.get('/orders', validatePagination, validateOrderStatusFilter, asyncHandler(async (req: Request, res: Response<PaginatedResponse<OrderSummary>>) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const status = req.query['status'] as OrderStatus;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  if (status) {
    where.status = status;
  }

  // Get orders with pagination
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        status: true,
        totalAmount: true,
        createdAt: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  const orderSummaries: OrderSummary[] = orders.map((order: any) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    status: order.status as OrderStatus,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
  }));

  const totalPages = Math.ceil(total / limit);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: orderSummaries,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    timestamp: new Date().toISOString(),
  });
}));

// GET /api/admin/orders/:id - Get order details
router.get('/orders/:id', validateOrderId, asyncHandler(async (req: Request, res: Response<ApiResponse<OrderResponse>>) => {
  const orderId = parseInt(req.params['id']!);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
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

  if (!order) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.ORDER_NOT_FOUND,
      error: 'Order not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const orderResponse: OrderResponse = {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    status: order.status as OrderStatus,
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

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: orderResponse,
    timestamp: new Date().toISOString(),
  });
}));

// PUT /api/admin/orders/:id/status - Update order status
router.put('/orders/:id/status', validateOrderId, validateUpdateOrderStatus, asyncHandler(async (req: Request, res: Response<ApiResponse<OrderResponse>>) => {
  const orderId = parseInt(req.params['id']!);
  const { status } = req.body as UpdateOrderStatusRequest;

  // Check if order exists
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!existingOrder) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.ORDER_NOT_FOUND,
      error: 'Order not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Update order status
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
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

  const orderResponse: OrderResponse = {
    id: updatedOrder.id,
    orderNumber: updatedOrder.orderNumber,
    customerName: updatedOrder.customerName,
    customerEmail: updatedOrder.customerEmail,
    customerPhone: updatedOrder.customerPhone,
    deliveryAddress: updatedOrder.deliveryAddress,
    status: updatedOrder.status as OrderStatus,
    totalAmount: Number(updatedOrder.totalAmount),
    items: updatedOrder.items.map((item: any) => ({
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
    createdAt: updatedOrder.createdAt.toISOString(),
    updatedAt: updatedOrder.updatedAt.toISOString(),
  };

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.ORDER_STATUS_UPDATED,
    data: orderResponse,
    timestamp: new Date().toISOString(),
  });
}));

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', asyncHandler(async (_req: Request, res: Response<ApiResponse<any>>) => {
  const [
    totalOrders,
    newOrders,
    paidOrders,
    readyOrders,
    totalRevenue,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: ORDER_STATUS.NEW } }),
    prisma.order.count({ where: { status: ORDER_STATUS.PAID } }),
    prisma.order.count({ where: { status: ORDER_STATUS.READY_FOR_DELIVERY } }),
    prisma.order.aggregate({
      where: { status: { in: [ORDER_STATUS.PAID, ORDER_STATUS.READY_FOR_DELIVERY] } },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        status: true,
        totalAmount: true,
        createdAt: true,
      },
    }),
  ]);

  const dashboardData = {
    statistics: {
      totalOrders,
      newOrders,
      paidOrders,
      readyOrders,
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
    },
    recentOrders: recentOrders.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status as OrderStatus,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt.toISOString(),
    })),
  };

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: dashboardData,
    timestamp: new Date().toISOString(),
  });
}));

export default router;
