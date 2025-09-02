// Application Constants
export const ORDER_STATUS = {
  NEW: 'new',
  PAID: 'paid',
  READY_FOR_DELIVERY: 'ready_for_delivery',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid username or password',
  TOKEN_REQUIRED: 'Access token is required',
  TOKEN_INVALID: 'Invalid or expired token',
  UNAUTHORIZED: 'Unauthorized access',
  
  // Products
  PRODUCT_NOT_FOUND: 'Product not found',
  PRODUCT_INACTIVE: 'Product is not available',
  
  // Orders
  ORDER_NOT_FOUND: 'Order not found',
  INVALID_ORDER_STATUS: 'Invalid order status',
  ORDER_ALREADY_PAID: 'Order is already paid',
  
  // Validation
  VALIDATION_ERROR: 'Validation error',
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PHONE: 'Invalid phone number',
  
  // General
  INTERNAL_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  DUPLICATE_ENTRY: 'Duplicate entry',
} as const;

export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  
  // Orders
  ORDER_CREATED: 'Order created successfully',
  ORDER_UPDATED: 'Order updated successfully',
  ORDER_STATUS_UPDATED: 'Order status updated successfully',
  
  // General
  OPERATION_SUCCESS: 'Operation completed successfully',
} as const;

export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: 'order_confirmation',
  NEW_ORDER_NOTIFICATION: 'new_order_notification',
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  UPLOAD_PATH: './uploads',
} as const;
