import { UserResponse } from './user';

// Authentication Request Types
export interface LoginRequest {
  username: string;
  password: string;
}

// Authentication Response Types
export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface LogoutRequest {
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
