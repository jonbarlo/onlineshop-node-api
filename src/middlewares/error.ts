import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { config } from '@/config';
import logger from '@/utils/logger';
import { ErrorResponse } from '@/types/api';
import { ERROR_MESSAGES, HTTP_STATUS } from '@/utils/constants';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      return createError('Duplicate entry - record already exists', HTTP_STATUS.CONFLICT);
    case 'P2025':
      return createError('Record not found', HTTP_STATUS.NOT_FOUND);
    case 'P2003':
      return createError('Foreign key constraint failed', HTTP_STATUS.BAD_REQUEST);
    case 'P2014':
      return createError('Invalid ID - record does not exist', HTTP_STATUS.BAD_REQUEST);
    default:
      return createError('Database operation failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

export const errorHandler = (
  error: AppError | Error,
  req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction
): void => {
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message: string = ERROR_MESSAGES.INTERNAL_ERROR;
  let details: any = undefined;

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(error);
    statusCode = prismaError.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    message = prismaError.message;
  }
  // Handle Prisma validation errors
  else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = ERROR_MESSAGES.VALIDATION_ERROR;
    details = error.message;
  }
  // Handle custom app errors
  else if ('statusCode' in error && error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = ERROR_MESSAGES.TOKEN_INVALID;
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = ERROR_MESSAGES.TOKEN_INVALID;
  }
  // Handle validation errors
  else if (error.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = ERROR_MESSAGES.VALIDATION_ERROR;
    details = error.message;
  }

  // Log error
  logger.error('API Error:', {
    error: error.message,
    stack: error.stack,
    statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Send error response
  const errorResponse: ErrorResponse = {
    success: false,
    message,
    error: config.nodeEnv === 'development' ? error.message : message,
    timestamp: new Date().toISOString(),
  };

  if (details && config.nodeEnv === 'development') {
    errorResponse.details = details;
  }

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (
  req: Request,
  _res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  const error = createError(`Route ${req.originalUrl} not found`, HTTP_STATUS.NOT_FOUND);
  next(error);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
