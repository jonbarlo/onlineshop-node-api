import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middlewares/error';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import {
  validateCreateProductImage,
  validateUpdateProductImage,
  validateReorderImages,
  validateProductId,
  validateImageId,
} from '../middlewares/validation';
import {
  CreateProductImageRequest,
  UpdateProductImageRequest,
  ReorderImagesRequest,
  ProductImageResponse,
  ProductImagesSummary,
} from '../types';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import { ApiResponse } from '../types';

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

// Helper function to ensure only one primary image per product
const ensureSinglePrimaryImage = async (productId: number, excludeImageId?: number) => {
  await prisma.productImage.updateMany({
    where: {
      productId,
      isPrimary: true,
      ...(excludeImageId && { id: { not: excludeImageId } }),
    },
    data: { isPrimary: false },
  });
};

// GET /api/admin/products/:id/images - List product images (Admin)
router.get('/admin/products/:id/images', authenticateToken, requireAdmin, validateProductId, asyncHandler(async (req: Request, res: Response<ApiResponse<ProductImageResponse[]>>) => {
  const productId = parseInt(req.params['id']!);

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
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

  const images = await prisma.productImage.findMany({
    where: { productId, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  const imageResponses = images.map(mapProductImageToResponse);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: imageResponses,
    timestamp: new Date().toISOString(),
  });
}));

// GET /api/products/:id/images - Get product images (Public)
router.get('/products/:id/images', validateProductId, asyncHandler(async (req: Request, res: Response<ApiResponse<ProductImagesSummary>>) => {
  const productId = parseInt(req.params['id']!);

  // Check if product exists and is active
  const product = await prisma.product.findFirst({
    where: { 
      id: productId,
      isActive: true,
      status: 'available',
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

  const images = await prisma.productImage.findMany({
    where: { productId, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  const imageResponses = images.map(mapProductImageToResponse);
  const primaryImage = imageResponses.find(img => img.isPrimary) || imageResponses[0];

  const summary: ProductImagesSummary = {
    totalImages: imageResponses.length,
    primaryImage,
    images: imageResponses,
  };

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: summary,
    timestamp: new Date().toISOString(),
  });
}));

// POST /api/admin/products/:id/images - Add image to product (Admin)
router.post('/admin/products/:id/images', authenticateToken, requireAdmin, validateProductId, validateCreateProductImage, asyncHandler(async (req: Request, res: Response<ApiResponse<ProductImageResponse>>) => {
  const productId = parseInt(req.params['id']!);
  const { imageUrl, altText, sortOrder = 0, isPrimary = false } = req.body as CreateProductImageRequest;

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
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

  // If this is the first image, make it primary
  const existingImagesCount = await prisma.productImage.count({
    where: { productId, isActive: true },
  });

  const shouldBePrimary = isPrimary || existingImagesCount === 0;

  // If setting as primary, ensure no other images are primary
  if (shouldBePrimary) {
    await ensureSinglePrimaryImage(productId);
  }

  const newImage = await prisma.productImage.create({
    data: {
      productId,
      imageUrl,
      altText: altText || null,
      sortOrder,
      isPrimary: shouldBePrimary,
    },
  });

  const imageResponse = mapProductImageToResponse(newImage);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: imageResponse,
    timestamp: new Date().toISOString(),
  });
}));

// PUT /api/admin/products/:id/images/:imageId - Update image (Admin)
router.put('/admin/products/:id/images/:imageId', authenticateToken, requireAdmin, validateProductId, validateImageId, validateUpdateProductImage, asyncHandler(async (req: Request, res: Response<ApiResponse<ProductImageResponse>>) => {
  const productId = parseInt(req.params['id']!);
  const imageId = parseInt(req.params['imageId']!);
  const { altText, sortOrder, isPrimary, isActive } = req.body as UpdateProductImageRequest;

  // Check if image exists and belongs to the product
  const existingImage = await prisma.productImage.findFirst({
    where: { 
      id: imageId,
      productId,
    },
  });

  if (!existingImage) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Image not found',
      error: 'Image not found or does not belong to this product',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // If setting as primary, ensure no other images are primary
  if (isPrimary === true) {
    await ensureSinglePrimaryImage(productId, imageId);
  }

  // Build update data
  const updateData: any = {};
  if (altText !== undefined) updateData.altText = altText;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
  if (isPrimary !== undefined) updateData.isPrimary = isPrimary;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updatedImage = await prisma.productImage.update({
    where: { id: imageId },
    data: updateData,
  });

  const imageResponse = mapProductImageToResponse(updatedImage);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: imageResponse,
    timestamp: new Date().toISOString(),
  });
}));

// DELETE /api/admin/products/:id/images/:imageId - Delete image (Admin)
router.delete('/admin/products/:id/images/:imageId', authenticateToken, requireAdmin, validateProductId, validateImageId, asyncHandler(async (req: Request, res: Response<ApiResponse<null>>) => {
  const productId = parseInt(req.params['id']!);
  const imageId = parseInt(req.params['imageId']!);

  // Check if image exists and belongs to the product
  const existingImage = await prisma.productImage.findFirst({
    where: { 
      id: imageId,
      productId,
    },
  });

  if (!existingImage) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Image not found',
      error: 'Image not found or does not belong to this product',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // If this is the primary image, make the next image primary
  if (existingImage.isPrimary) {
    const nextImage = await prisma.productImage.findFirst({
      where: { 
        productId,
        isActive: true,
        id: { not: imageId },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    if (nextImage) {
      await prisma.productImage.update({
        where: { id: nextImage.id },
        data: { isPrimary: true },
      });
    }
  }

  // Soft delete the image
  await prisma.productImage.update({
    where: { id: imageId },
    data: { isActive: false },
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: null,
    timestamp: new Date().toISOString(),
  });
}));

// PUT /api/admin/products/:id/images/reorder - Reorder images (Admin)
router.put('/admin/products/:id/images/reorder', authenticateToken, requireAdmin, validateProductId, validateReorderImages, asyncHandler(async (req: Request, res: Response<ApiResponse<ProductImageResponse[]>>) => {
  const productId = parseInt(req.params['id']!);
  const { imageIds } = req.body as ReorderImagesRequest;

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
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

  // Verify all images belong to this product
  const images = await prisma.productImage.findMany({
    where: { 
      id: { in: imageIds },
      productId,
      isActive: true,
    },
  });

  if (images.length !== imageIds.length) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Invalid image IDs',
      error: 'Some images do not belong to this product or are inactive',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Update sort order for each image
  const updatePromises = imageIds.map((imageId, index) =>
    prisma.productImage.update({
      where: { id: imageId },
      data: { sortOrder: index },
    })
  );

  await Promise.all(updatePromises);

  // Get updated images
  const updatedImages = await prisma.productImage.findMany({
    where: { productId, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  const imageResponses = updatedImages.map(mapProductImageToResponse);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
    data: imageResponses,
    timestamp: new Date().toISOString(),
  });
}));

export default router;
