import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { OrderResponse, OrderSummary, OrderStatus, UpdateOrderStatusRequest, ORDER_STATUS } from '../types/order';
import { ProductResponse, CreateProductRequest, UpdateProductRequest } from '../types/product';
import { ProductImageResponse } from '../types/productImage';
import { CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest } from '../types/category';
import { ApiResponse, PaginatedResponse } from '../types/api';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, HTTP_STATUS } from '../utils/constants';
import { asyncHandler } from '../middlewares/error';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { validateOrderId, validateUpdateOrderStatus, validatePagination, validateOrderStatusFilter, validateProductId, validateCreateProduct, validateUpdateProduct } from '../middlewares/validation';

const router = Router();

// Helper function to map ProductImage to ProductImageResponse
const mapProductImageToResponse = (image: any): ProductImageResponse => ({
  id: image.id,
  productId: image.productId,
  imageUrl: image.imageUrl,
  altText: image.altText,
  sortOrder: image.sortOrder,
  isPrimary: image.isPrimary,
  isActive: image.isActive,
  createdAt: image.createdAt.toISOString(),
  updatedAt: image.updatedAt.toISOString(),
});

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
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              quantity: true,
              status: true,
            },
          },
        },
      },
    },
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

  // If updating to paid status, deduct inventory
  if (status === ORDER_STATUS.PAID && existingOrder.status !== ORDER_STATUS.PAID) {
    // Check if all products have sufficient quantity
    for (const item of existingOrder.items) {
      if (item.product.quantity < item.quantity) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Insufficient inventory',
          error: `Product "${item.product.name}" only has ${item.product.quantity} units available, but ${item.quantity} were ordered`,
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // Deduct inventory in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Update each product's quantity
      for (const item of existingOrder.items) {
        const newQuantity = item.product.quantity - item.quantity;
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: newQuantity,
            status: newQuantity > 0 ? 'available' : 'sold_out',
          },
        });
      }

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status },
      });
    });
  } else {
    // For other status updates, just update the order
    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  // Fetch updated order with all details
  const updatedOrder = await prisma.order.findUnique({
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

  if (!updatedOrder) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch updated order',
      error: 'Order not found after update',
      timestamp: new Date().toISOString(),
    });
    return;
  }

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

// GET /api/admin/dashboard - Get comprehensive dashboard statistics
router.get('/dashboard', asyncHandler(async (_req: Request, res: Response<ApiResponse<any>>) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    // Order counts
    totalOrders,
    newOrders,
    paidOrders,
    readyOrders,
    totalRevenue,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    yearRevenue,
    
    // Product counts
    totalProducts,
    activeProducts,
    soldOutProducts,
    lowStockProducts,
    
    // Recent orders
    recentOrders,
    
    // Recent products
    recentProducts,
    
    // Category statistics
    categoryStats,
    
    // Order trends
    ordersLast7Days,
    ordersLast30Days,
    
    // Customer statistics
    customerStats,
  ] = await Promise.all([
    // Order counts
    prisma.order.count(),
    prisma.order.count({ where: { status: ORDER_STATUS.NEW } }),
    prisma.order.count({ where: { status: ORDER_STATUS.PAID } }),
    prisma.order.count({ where: { status: ORDER_STATUS.READY_FOR_DELIVERY } }),
    
    // Revenue calculations
    prisma.order.aggregate({
      where: { status: { in: [ORDER_STATUS.PAID, ORDER_STATUS.READY_FOR_DELIVERY] } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { 
        status: { in: [ORDER_STATUS.PAID, ORDER_STATUS.READY_FOR_DELIVERY] },
        createdAt: { gte: startOfToday }
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { 
        status: { in: [ORDER_STATUS.PAID, ORDER_STATUS.READY_FOR_DELIVERY] },
        createdAt: { gte: startOfWeek }
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { 
        status: { in: [ORDER_STATUS.PAID, ORDER_STATUS.READY_FOR_DELIVERY] },
        createdAt: { gte: startOfMonth }
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { 
        status: { in: [ORDER_STATUS.PAID, ORDER_STATUS.READY_FOR_DELIVERY] },
        createdAt: { gte: startOfYear }
      },
      _sum: { totalAmount: true },
    }),
    
    // Product counts
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true, status: 'available' } }),
    prisma.product.count({ where: { status: 'sold_out' } }),
    prisma.product.count({ where: { quantity: { lte: 5, gt: 0 }, status: 'available' } }),
    
    // Recent orders
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
    
    // Recent products
    prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        price: true,
        quantity: true,
        status: true,
        createdAt: true,
      },
    }),
    
    // Category statistics
    prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    }),
    
    // Order trends
    prisma.order.count({
      where: {
        createdAt: { gte: new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)) }
      }
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)) }
      }
    }),
    
    // Customer statistics
    prisma.order.groupBy({
      by: ['customerEmail'],
      _count: { customerEmail: true }
    }),
  ]);

  // Calculate inventory value (simplified - would need price * quantity in real implementation)
  const inventoryValue = await prisma.product.aggregate({
    where: { isActive: true },
    _sum: { 
      price: true 
    },
  });

  const dashboardData = {
    // Core Statistics
    statistics: {
      // Order Metrics
      totalOrders,
      newOrders,
      paidOrders,
      readyOrders,
      
      // Revenue Metrics
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      todayRevenue: Number(todayRevenue._sum.totalAmount || 0),
      weekRevenue: Number(weekRevenue._sum.totalAmount || 0),
      monthRevenue: Number(monthRevenue._sum.totalAmount || 0),
      yearRevenue: Number(yearRevenue._sum.totalAmount || 0),
      
      // Product Metrics
      totalProducts,
      activeProducts,
      soldOutProducts,
      lowStockProducts,
      totalInventoryValue: Number(inventoryValue._sum.price || 0),
      
      // Customer Metrics
      totalCustomers: Array.isArray(customerStats) ? customerStats.length : 0,
      repeatCustomers: Array.isArray(customerStats) ? customerStats.filter((r: any) => r._count.customerEmail > 1).length : 0,
      
      // Trend Metrics
      ordersLast7Days,
      ordersLast30Days,
    },
    
    // Recent Activity
    recentOrders: Array.isArray(recentOrders) ? recentOrders.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status as OrderStatus,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt.toISOString(),
    })) : [],
    
    recentProducts: Array.isArray(recentProducts) ? recentProducts.map((product: any) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: product.quantity,
      status: product.status as 'available' | 'sold_out',
      createdAt: product.createdAt.toISOString(),
    })) : [],
    
    // Category Breakdown
    categoryStats: Array.isArray(categoryStats) ? categoryStats.map((category: any) => ({
      id: category.id,
      name: category.name,
      productCount: category._count?.products || 0,
    })) : [],
    
    // Performance Indicators
    performance: {
      conversionRate: totalOrders > 0 ? ((paidOrders / totalOrders) * 100).toFixed(1) : '0.0',
      averageOrderValue: totalOrders > 0 ? (Number(totalRevenue._sum.totalAmount || 0) / totalOrders).toFixed(2) : '0.00',
      stockTurnover: activeProducts > 0 ? (soldOutProducts / activeProducts * 100).toFixed(1) : '0.0',
      lowStockAlert: lowStockProducts > 0,
    },
    
    // Alerts & Notifications
    alerts: {
      lowStock: lowStockProducts,
      soldOut: soldOutProducts,
      newOrders: newOrders,
      readyForDelivery: readyOrders,
    }
  };

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: dashboardData,
    timestamp: new Date().toISOString(),
  });
}));

// ===========================================
// PRODUCT MANAGEMENT ENDPOINTS
// ===========================================

// GET /api/admin/products - List all products (admin view - includes inactive)
router.get('/products', validatePagination, asyncHandler(async (req: Request, res: Response<PaginatedResponse<ProductResponse>>) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const skip = (page - 1) * limit;
  
  // Extract filter parameters
  const status = req.query['status'] as string | undefined;
  const isActive = req.query['isActive'] as string | undefined;
  const search = req.query['search'] as string | undefined;

  // Build where clause
  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Get products with pagination (admin can see inactive products)
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            isActive: true,
            sortOrder: true,
            createdAt: true,
            updatedAt: true
          }
        },
        images: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const productResponses: ProductResponse[] = products.map((product: any) => {
    const images = product.images.map(mapProductImageToResponse);
    const primaryImage = images.find((img: ProductImageResponse) => img.isPrimary) || images[0];

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      imageUrl: product.imageUrl || undefined, // Deprecated - kept for backward compatibility
      categoryId: product.categoryId,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        description: product.category.description,
        slug: product.category.slug,
        isActive: product.category.isActive,
        sortOrder: product.category.sortOrder,
        createdAt: product.category.createdAt.toISOString(),
        updatedAt: product.category.updatedAt.toISOString(),
      } : null,
      quantity: product.quantity,
      ...(product.color && { color: product.color }),
      ...(product.size && { size: product.size }),
      status: product.status as 'available' | 'sold_out',
      isActive: product.isActive,
      images,
      primaryImage,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  });

  const totalPages = Math.ceil(total / limit);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: productResponses,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    timestamp: new Date().toISOString(),
  });
}));

// GET /api/admin/products/:id - Get product by ID (admin view - includes inactive/sold out)
router.get('/products/:id', validateProductId, asyncHandler(async (req: Request, res: Response<ApiResponse<ProductResponse>>) => {
  const productId = parseInt(req.params['id']!);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          isActive: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true
        }
      },
      images: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }
    }
  });

  if (!product) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.PRODUCT_NOT_FOUND,
      error: 'Product not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const images = product.images.map(mapProductImageToResponse);
  const primaryImage = images.find(img => img.isPrimary) || images[0];

  const productResponse: ProductResponse = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    ...(product.imageUrl && { imageUrl: product.imageUrl }), // Deprecated - kept for backward compatibility
    categoryId: product.categoryId,
    category: product.category ? {
      id: product.category.id,
      name: product.category.name,
      description: product.category.description,
      slug: product.category.slug,
      isActive: product.category.isActive,
      sortOrder: product.category.sortOrder,
      createdAt: product.category.createdAt.toISOString(),
      updatedAt: product.category.updatedAt.toISOString(),
    } : null,
    quantity: product.quantity,
    ...(product.color && { color: product.color }),
    ...(product.size && { size: product.size }),
    status: product.status as 'available' | 'sold_out',
    isActive: product.isActive,
    images,
    primaryImage,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: productResponse,
    timestamp: new Date().toISOString(),
  });
}));

// POST /api/admin/products - Create new product
router.post('/products', validateCreateProduct, asyncHandler(async (req: Request, res: Response<ApiResponse<ProductResponse>>) => {
  const { name, description, price, imageUrl, categoryId, quantity = 0, color, size } = req.body as CreateProductRequest;
  const quantityNum = parseInt(quantity.toString());

  // Validate required fields
  if (!name || !description || price === undefined) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_ERROR,
      error: 'Name, description, and price are required',
      timestamp: new Date().toISOString(),
    });
  }

  // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        imageUrl: imageUrl || null,
        categoryId: categoryId || null,
        quantity: quantityNum,
        color: color || null,
        size: size || null,
        status: quantityNum > 0 ? 'available' : 'sold_out',
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            isActive: true,
            sortOrder: true,
            createdAt: true,
            updatedAt: true
          }
        },
        images: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        }
      }
    });

  const images = product.images.map(mapProductImageToResponse);
  const primaryImage = images.find(img => img.isPrimary) || images[0];

  const productResponse: ProductResponse = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    ...(product.imageUrl && { imageUrl: product.imageUrl }), // Deprecated - kept for backward compatibility
    categoryId: product.categoryId,
    category: product.category ? {
      id: product.category.id,
      name: product.category.name,
      description: product.category.description,
      slug: product.category.slug,
      isActive: product.category.isActive,
      sortOrder: product.category.sortOrder,
      createdAt: product.category.createdAt.toISOString(),
      updatedAt: product.category.updatedAt.toISOString(),
    } : null,
    quantity: product.quantity,
    ...(product.color && { color: product.color }),
    ...(product.size && { size: product.size }),
    status: product.status as 'available' | 'sold_out',
    isActive: product.isActive,
    images,
    primaryImage,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Product created successfully',
    data: productResponse,
    timestamp: new Date().toISOString(),
  });
}));

// PUT /api/admin/products/:id - Update product
router.put('/products/:id', validateProductId, validateUpdateProduct, asyncHandler(async (req: Request, res: Response<ApiResponse<ProductResponse>>) => {
  const productId = parseInt(req.params['id']!);
  const { name, description, price, imageUrl, categoryId, quantity, color, size, isActive } = req.body as UpdateProductRequest;

  // Check if product exists
  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!existingProduct) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.PRODUCT_NOT_FOUND,
      error: 'Product not found',
      timestamp: new Date().toISOString(),
    });
  }

  // Prepare update data (only include fields that are provided)
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = price;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (categoryId !== undefined) updateData.categoryId = categoryId;
  if (color !== undefined) updateData.color = color;
  if (size !== undefined) updateData.size = size;
  if (quantity !== undefined) {
    updateData.quantity = parseInt(quantity.toString());
    // Update status based on quantity
    updateData.status = updateData.quantity > 0 ? 'available' : 'sold_out';
  }
  if (isActive !== undefined) updateData.isActive = isActive;

  // Update product
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: updateData,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          isActive: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true
        }
      },
      images: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }
    }
  });

  const images = updatedProduct.images.map(mapProductImageToResponse);
  const primaryImage = images.find(img => img.isPrimary) || images[0];

  const productResponse: ProductResponse = {
    id: updatedProduct.id,
    name: updatedProduct.name,
    description: updatedProduct.description,
    price: Number(updatedProduct.price),
    ...(updatedProduct.imageUrl && { imageUrl: updatedProduct.imageUrl }), // Deprecated - kept for backward compatibility
    categoryId: updatedProduct.categoryId,
    category: updatedProduct.category ? {
      id: updatedProduct.category.id,
      name: updatedProduct.category.name,
      description: updatedProduct.category.description,
      slug: updatedProduct.category.slug,
      isActive: updatedProduct.category.isActive,
      sortOrder: updatedProduct.category.sortOrder,
      createdAt: updatedProduct.category.createdAt.toISOString(),
      updatedAt: updatedProduct.category.updatedAt.toISOString(),
    } : null,
    quantity: updatedProduct.quantity,
    ...(updatedProduct.color && { color: updatedProduct.color }),
    ...(updatedProduct.size && { size: updatedProduct.size }),
    status: updatedProduct.status as 'available' | 'sold_out',
    isActive: updatedProduct.isActive,
    images,
    primaryImage,
    createdAt: updatedProduct.createdAt.toISOString(),
    updatedAt: updatedProduct.updatedAt.toISOString(),
  };

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Product updated successfully',
    data: productResponse,
    timestamp: new Date().toISOString(),
  });
}));

// DELETE /api/admin/products/:id - Delete product (soft delete)
router.delete('/products/:id', validateProductId, asyncHandler(async (req: Request, res: Response<ApiResponse<void>>) => {
  const productId = parseInt(req.params['id']!);

  // Check if product exists
  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!existingProduct) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.PRODUCT_NOT_FOUND,
      error: 'Product not found',
      timestamp: new Date().toISOString(),
    });
  }

  // Soft delete by setting isActive to false
  await prisma.product.update({
    where: { id: productId },
    data: { isActive: false },
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Product deleted successfully',
    timestamp: new Date().toISOString(),
  });
}));

// ===== CATEGORY MANAGEMENT ENDPOINTS =====

// GET /api/admin/categories - List all categories (including inactive)
router.get('/categories', validatePagination, asyncHandler(async (req: Request, res: Response<PaginatedResponse<CategoryResponse>>) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const skip = (page - 1) * limit;

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      skip,
      take: limit,
    }),
    prisma.category.count(),
  ]);

  const categoryResponses: CategoryResponse[] = categories.map((category: any) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    slug: category.slug,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  }));

  const totalPages = Math.ceil(total / limit);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: categoryResponses,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    timestamp: new Date().toISOString(),
  });
}));

// POST /api/admin/categories - Create new category
router.post('/categories', asyncHandler(async (req: Request<{}, ApiResponse<CategoryResponse>, CreateCategoryRequest>, res: Response<ApiResponse<CategoryResponse>>) => {
  const { name, description, slug, sortOrder = 0 } = req.body;

  // Check if category with same name or slug already exists
  const existingCategory = await prisma.category.findFirst({
    where: {
      OR: [
        { name: name },
        { slug: slug }
      ]
    }
  });

  if (existingCategory) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'Category with this name or slug already exists',
      error: 'Duplicate category',
      timestamp: new Date().toISOString(),
    });
  }

  const newCategory = await prisma.category.create({
    data: {
      name,
      description: description || null,
      slug,
      sortOrder,
    },
  });

  const categoryResponse: CategoryResponse = {
    id: newCategory.id,
    name: newCategory.name,
    description: newCategory.description,
    slug: newCategory.slug,
    isActive: newCategory.isActive,
    sortOrder: newCategory.sortOrder,
    createdAt: newCategory.createdAt.toISOString(),
    updatedAt: newCategory.updatedAt.toISOString(),
  };

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Category created successfully',
    data: categoryResponse,
    timestamp: new Date().toISOString(),
  });
}));

// PUT /api/admin/categories/:id - Update category
router.put('/categories/:id', asyncHandler(async (req: Request<{ id: string }, ApiResponse<CategoryResponse>, UpdateCategoryRequest>, res: Response<ApiResponse<CategoryResponse>>) => {
  const categoryId = parseInt(req.params['id']!);
  const { name, description, slug, isActive, sortOrder } = req.body;

  // Check if category exists
  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existingCategory) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Category not found',
      error: 'Category not found',
      timestamp: new Date().toISOString(),
    });
  }

  // Check if another category with same name or slug exists (excluding current one)
  if (name || slug) {
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        AND: [
          { id: { not: categoryId } },
          {
            OR: [
              ...(name ? [{ name: name }] : []),
              ...(slug ? [{ slug: slug }] : [])
            ]
          }
        ]
      }
    });

    if (duplicateCategory) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Category with this name or slug already exists',
        error: 'Duplicate category',
        timestamp: new Date().toISOString(),
      });
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description: description || null }),
      ...(slug && { slug }),
      ...(isActive !== undefined && { isActive }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });

  const categoryResponse: CategoryResponse = {
    id: updatedCategory.id,
    name: updatedCategory.name,
    description: updatedCategory.description,
    slug: updatedCategory.slug,
    isActive: updatedCategory.isActive,
    sortOrder: updatedCategory.sortOrder,
    createdAt: updatedCategory.createdAt.toISOString(),
    updatedAt: updatedCategory.updatedAt.toISOString(),
  };

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Category updated successfully',
    data: categoryResponse,
    timestamp: new Date().toISOString(),
  });
}));

// DELETE /api/admin/categories/:id - Delete category (soft delete)
router.delete('/categories/:id', asyncHandler(async (req: Request, res: Response<ApiResponse<void>>) => {
  const categoryId = parseInt(req.params['id']!);

  // Check if category exists
  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existingCategory) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Category not found',
      error: 'Category not found',
      timestamp: new Date().toISOString(),
    });
  }

  // Check if category has products
  const productCount = await prisma.product.count({
    where: { categoryId: categoryId, isActive: true }
  });

  if (productCount > 0) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'Cannot delete category with active products',
      error: `Category has ${productCount} active products`,
      timestamp: new Date().toISOString(),
    });
  }

  // Soft delete by setting isActive to false
  await prisma.category.update({
    where: { id: categoryId },
    data: { isActive: false },
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Category deleted successfully',
    timestamp: new Date().toISOString(),
  });
}));

export default router;
