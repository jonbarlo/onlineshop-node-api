// JWT Token Types
export interface JwtPayload {
  userId: number;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface TokenResponse {
  token: string;
  expiresIn: string;
}
