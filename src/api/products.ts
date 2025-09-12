import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { ProductResponse, ProductSummary } from '../types/product';
import { ApiResponse } from '../types/api';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, HTTP_STATUS } from '../utils/constants';
import { asyncHandler } from '../middlewares/error';
import { validateProductId, validatePagination } from '../middlewares/validation';

const router = Router();

// GET /api/products - List all active products with filtering
router.get('/', validatePagination, asyncHandler(async (req: Request, res: Response<ApiResponse<ProductResponse[]>>) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const skip = (page - 1) * limit;

  // Extract filter parameters
  const categoryId = req.query['categoryId'] ? parseInt(req.query['categoryId'] as string) : undefined;
  const categorySlug = req.query['categorySlug'] as string | undefined;
  const minPrice = req.query['minPrice'] ? parseFloat(req.query['minPrice'] as string) : undefined;
  const maxPrice = req.query['maxPrice'] ? parseFloat(req.query['maxPrice'] as string) : undefined;
  const search = req.query['search'] as string | undefined;

  // Build where clause
  const where: any = { isActive: true };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (categorySlug) {
    where.category = {
      slug: categorySlug,
      isActive: true
    };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Get products with pagination and category information
  const products = await prisma.product.findMany({
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
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  const productResponses: ProductResponse[] = products.map((product: any) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    imageUrl: product.imageUrl || undefined,
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
      }
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
      categoryId: true,
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
      }
    },
    orderBy: { name: 'asc' },
  });

  const productSummaries: ProductSummary[] = products.map((product: any) => ({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    imageUrl: product.imageUrl || undefined,
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
  }));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: productSummaries,
    timestamp: new Date().toISOString(),
  });
}));

export default router;
