import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { ProductResponse, ProductSummary } from '../types/product';
import { ProductImageResponse } from '../types/productImage';
import { ApiResponse } from '../types/api';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, HTTP_STATUS } from '../utils/constants';
import { asyncHandler } from '../middlewares/error';
import { validateProductId, validatePagination } from '../middlewares/validation';

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
  const colors = req.query['colors'] as string | undefined;
  const sizes = req.query['sizes'] as string | undefined;
  const colorArray = colors ? colors.split(',').map(c => c.trim()) : undefined;
  const sizeArray = sizes ? sizes.split(',').map(s => s.trim()) : undefined;

  // Build where clause
  const where: any = { 
    isActive: true,
    status: 'available' // Only show available products to customers
  };

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

  if (colorArray && colorArray.length > 0) {
    where.OR = where.OR || [];
    colorArray.forEach(color => {
      where.OR.push({
        colors: { contains: `"${color}"` }
      });
    });
  }

  if (sizeArray && sizeArray.length > 0) {
    where.OR = where.OR || [];
    sizeArray.forEach(size => {
      where.OR.push({
        sizes: { contains: `"${size}"` }
      });
    });
  }

  // Get products with pagination, category information, and images
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
      },
      images: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

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
      colors: product.colors ? JSON.parse(product.colors) : [],
      sizes: product.sizes ? JSON.parse(product.sizes) : [],
      status: product.status as 'available' | 'sold_out',
      isActive: product.isActive,
      images,
      primaryImage,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  });

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
      status: 'available', // Only show available products to customers
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
    colors: product.colors ? JSON.parse(product.colors) : [],
    sizes: product.sizes ? JSON.parse(product.sizes) : [],
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

// GET /api/products/summary - Get product summaries (for cart/quick view)
router.get('/summary/list', asyncHandler(async (_req: Request, res: Response<ApiResponse<ProductSummary[]>>) => {
  const products = await prisma.product.findMany({
    where: { 
      isActive: true,
      status: 'available' // Only show available products to customers
    },
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
      },
      images: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          productId: true,
          imageUrl: true,
          altText: true,
          sortOrder: true,
          isPrimary: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }
    },
    orderBy: { name: 'asc' },
  });

  const productSummaries: ProductSummary[] = products.map((product: any) => {
    const images = product.images.map(mapProductImageToResponse);
    const primaryImage = images.find((img: ProductImageResponse) => img.isPrimary) || images[0];

    return {
      id: product.id,
      name: product.name,
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
      colors: product.colors ? JSON.parse(product.colors) : [],
      sizes: product.sizes ? JSON.parse(product.sizes) : [],
      status: product.status as 'available' | 'sold_out',
      primaryImage,
    };
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: productSummaries,
    timestamp: new Date().toISOString(),
  });
}));

export default router;
