// Standard API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  timestamp: string;
  details?: any;
}

// Request/Response Types
export interface RequestWithUser extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

// Validation Error Type
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
