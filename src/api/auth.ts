import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { config } from '@/config';
import { LoginRequest, LoginResponse } from '@/types/auth';
import { ApiResponse } from '@/types/api';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, HTTP_STATUS } from '@/utils/constants';
import { asyncHandler } from '@/middlewares/error';
import { validateLogin } from '@/middlewares/validation';

const router = Router();

// POST /api/auth/login
router.post('/login', validateLogin, asyncHandler(async (req: Request<{}, ApiResponse<LoginResponse>, LoginRequest>, res: Response<ApiResponse<LoginResponse>>) => {
  const { username, password } = req.body;

  // Find user by username or email
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email: username },
      ],
      isActive: true,
    },
  });

  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_CREDENTIALS,
      error: 'User not found or inactive',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_CREDENTIALS,
      error: 'Invalid password',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  const response: LoginResponse = {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  };

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    data: response,
    timestamp: new Date().toISOString(),
  });
}));

// POST /api/auth/logout (optional - for token blacklisting in future)
router.post('/logout', asyncHandler(async (_req: Request, res: Response<ApiResponse>) => {
  // In a more sophisticated system, you might blacklist the token here
  // For now, we'll just return success since JWT tokens are stateless
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
    timestamp: new Date().toISOString(),
  });
}));

export default router;
