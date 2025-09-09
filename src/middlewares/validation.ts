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
