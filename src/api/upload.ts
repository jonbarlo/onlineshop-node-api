import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { ApiResponse } from '../types/api';
import logger from '../utils/logger';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/products');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
    }
  }
});

/**
 * @route POST /api/upload/product-image
 * @desc Upload product image (Admin only)
 * @access Private
 */
router.post('/product-image', authenticateToken, requireAdmin, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      } as ApiResponse);
    }

    // Generate public URL for the uploaded file
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const imageUrl = `${baseUrl}/uploads/products/${req.file.filename}`;

    logger.info('Product image uploaded', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        imageUrl,
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Error uploading product image:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image',
    } as ApiResponse);
  }
});

/**
 * @route DELETE /api/upload/product-image/:filename
 * @desc Delete product image (Admin only)
 * @access Private
 */
router.delete('/product-image/:filename', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename parameter is required',
      } as ApiResponse);
    }
    const filePath = path.join(__dirname, '../../uploads/products', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image file not found',
      } as ApiResponse);
    }

    // Delete the file
    fs.unlinkSync(filePath);

    logger.info('Product image deleted', { filename });

    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Error deleting product image:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete image',
    } as ApiResponse);
  }
});

export default router;

