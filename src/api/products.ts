import { Router, Request, Response } from 'express';
import { prisma } from '@/config/database';
import { ProductResponse, ProductSummary } from '@/types/product';
import { ApiResponse } from '@/types/api';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, HTTP_STATUS } from '@/utils/constants';
import { asyncHandler } from '@/middlewares/error';
import { validateProductId, validatePagination } from '@/middlewares/validation';

const router = Router();

// GET /api/products - List all active products
router.get('/', validatePagination, asyncHandler(async (req: Request, res: Response<ApiResponse<ProductResponse[]>>) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const skip = (page - 1) * limit;

  // Get products with pagination
  const [products] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const productResponses: ProductResponse[] = products.map((product: any) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    imageUrl: product.imageUrl || undefined,
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: productResponses,
    timestamp: new Date().toISOString(),
  });
}));

// GET /api/products/:id - Get product details
router.get('/:id', validateProductId, asyncHandler(async (req: Request, res: Response<ApiResponse<ProductResponse>>) => {
  const productId = parseInt(req.params['id']!);

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true,
    },
  });

  if (!product) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.PRODUCT_NOT_FOUND,
      error: 'Product not found or inactive',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const productResponse: ProductResponse = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    ...(product.imageUrl && { imageUrl: product.imageUrl }),
    isActive: product.isActive,
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

// GET /api/products/summary - Get product summaries (for cart/quick view)
router.get('/summary/list', asyncHandler(async (_req: Request, res: Response<ApiResponse<ProductSummary[]>>) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      price: true,
      imageUrl: true,
    },
    orderBy: { name: 'asc' },
  });

  const productSummaries: ProductSummary[] = products.map((product: any) => ({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    imageUrl: product.imageUrl || undefined,
  }));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: productSummaries,
    timestamp: new Date().toISOString(),
  });
}));

export default router;
