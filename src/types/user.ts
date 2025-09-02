// User Entity Types
export interface User {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  isActive?: boolean;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
