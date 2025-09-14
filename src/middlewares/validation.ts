import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ApiResponse, ValidationError } from '../types/api';
import { ERROR_MESSAGES, HTTP_STATUS } from '../utils/constants';

export const handleValidationErrors = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors: ValidationError[] = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_ERROR,
      error: 'Validation failed',
      data: validationErrors,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};

// Authentication validation rules
export const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

// Product validation rules
export const validateProductId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
  handleValidationErrors,
];

export const validateCreateProduct = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Product description must be between 10 and 1000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  body('colors')
    .optional()
    .isArray()
    .withMessage('Colors must be an array'),
  body('colors.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each color must not exceed 50 characters'),
  body('sizes')
    .optional()
    .isArray()
    .withMessage('Sizes must be an array'),
  body('sizes.*')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Each size must not exceed 20 characters'),
  body('variants')
    .optional()
    .isArray()
    .withMessage('Variants must be an array of objects'),
  body('variants.*.color')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Variant color must be between 1 and 50 characters'),
  body('variants.*.size')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Variant size must be between 1 and 20 characters'),
  body('variants.*.quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Variant quantity must be a non-negative integer'),
  body('variants.*.sku')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Variant SKU must not exceed 100 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

export const validateUpdateProduct = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Product description must be between 10 and 1000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  body('colors')
    .optional()
    .isArray()
    .withMessage('Colors must be an array'),
  body('colors.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each color must not exceed 50 characters'),
  body('sizes')
    .optional()
    .isArray()
    .withMessage('Sizes must be an array'),
  body('sizes.*')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Each size must not exceed 20 characters'),
  body('variants')
    .optional()
    .isArray()
    .withMessage('Variants must be an array of objects'),
  body('variants.*.color')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Variant color must be between 1 and 50 characters'),
  body('variants.*.size')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Variant size must be between 1 and 20 characters'),
  body('variants.*.quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Variant quantity must be a non-negative integer'),
  body('variants.*.sku')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Variant SKU must not exceed 100 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

// Order validation rules
export const validateCreateOrder = [
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  body('customerEmail')
    .trim()
    .notEmpty()
    .withMessage('Customer email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('customerPhone')
    .trim()
    .notEmpty()
    .withMessage('Customer phone is required')
    .isLength({ min: 8, max: 20 })
    .withMessage('Phone number must be between 8 and 20 characters'),
  body('deliveryAddress')
    .trim()
    .notEmpty()
    .withMessage('Delivery address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Delivery address must be between 10 and 500 characters'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
  body('items.*.selectedColor')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Selected color must be a string between 1 and 50 characters'),
  body('items.*.selectedSize')
    .optional()
    .isString()
    .isLength({ min: 1, max: 20 })
    .withMessage('Selected size must be a string between 1 and 20 characters'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  handleValidationErrors,
];

export const validateOrderId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a positive integer'),
  handleValidationErrors,
];

export const validateUpdateOrderStatus = [
  body('status')
    .isIn(['new', 'paid', 'ready_for_delivery'])
    .withMessage('Status must be one of: new, paid, ready_for_delivery'),
  handleValidationErrors,
];

// Query validation rules
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

export const validateOrderStatusFilter = [
  query('status')
    .optional()
    .isIn(['new', 'paid', 'ready_for_delivery'])
    .withMessage('Status must be one of: new, paid, ready_for_delivery'),
  handleValidationErrors,
];

// Product Image validation rules
export const validateCreateProductImage = [
  body('imageUrl')
    .trim()
    .notEmpty()
    .withMessage('Image URL is required')
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Image URL must be a valid HTTP or HTTPS URL')
    .isLength({ max: 500 })
    .withMessage('Image URL must not exceed 500 characters'),
  body('altText')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Alt text must not exceed 255 characters'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be a boolean'),
  handleValidationErrors,
];

export const validateUpdateProductImage = [
  body('altText')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Alt text must not exceed 255 characters'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be a boolean'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

export const validateReorderImages = [
  body('imageIds')
    .isArray({ min: 1 })
    .withMessage('imageIds must be a non-empty array')
    .custom((value: any[]) => {
      if (!value.every(id => Number.isInteger(id) && id > 0)) {
        throw new Error('All image IDs must be positive integers');
      }
      return true;
    }),
  handleValidationErrors,
];

export const validateImageId = [
  param('imageId')
    .isInt({ min: 1 })
    .withMessage('Image ID must be a positive integer'),
  handleValidationErrors,
];
