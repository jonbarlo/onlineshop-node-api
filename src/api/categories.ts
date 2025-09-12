import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { CategoryResponse, CategorySummary } from '../types/category';
import { ApiResponse } from '../types/api';
import { SUCCESS_MESSAGES, HTTP_STATUS } from '../utils/constants';
import { asyncHandler } from '../middlewares/error';
import { validatePagination } from '../middlewares/validation';

const router = Router();

// GET /api/categories - List all active categories
router.get('/', validatePagination, asyncHandler(async (req: Request, res: Response<ApiResponse<CategoryResponse[]>>) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 50;
  const skip = (page - 1) * limit;

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' }
    ],
    skip,
    take: limit,
  });

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

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: categoryResponses,
    timestamp: new Date().toISOString(),
  });
}));

// GET /api/categories/summary - Get category summaries with product counts
router.get('/summary', asyncHandler(async (_req: Request, res: Response<ApiResponse<CategorySummary[]>>) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { products: { where: { isActive: true } } }
      }
    },
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' }
    ],
  });

  const categorySummaries: CategorySummary[] = categories.map((category: any) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    productCount: category._count.products,
  }));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: categorySummaries,
    timestamp: new Date().toISOString(),
  });
}));

// GET /api/categories/:id - Get category details
router.get('/:id', asyncHandler(async (req: Request, res: Response<ApiResponse<CategoryResponse>>) => {
  const categoryId = parseInt(req.params['id']!);

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      isActive: true,
    },
  });

  if (!category) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Category not found',
      error: 'Category not found or inactive',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const categoryResponse: CategoryResponse = {
    id: category.id,
    name: category.name,
    description: category.description,
    slug: category.slug,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: categoryResponse,
    timestamp: new Date().toISOString(),
  });
}));

// GET /api/categories/slug/:slug - Get category by slug
router.get('/slug/:slug', asyncHandler(async (req: Request, res: Response<ApiResponse<CategoryResponse>>) => {
  const slug = req.params['slug']!;

  const category = await prisma.category.findFirst({
    where: {
      slug: slug,
      isActive: true,
    },
  });

  if (!category) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Category not found',
      error: 'Category not found or inactive',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const categoryResponse: CategoryResponse = {
    id: category.id,
    name: category.name,
    description: category.description,
    slug: category.slug,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: categoryResponse,
    timestamp: new Date().toISOString(),
  });
}));

export default router;
