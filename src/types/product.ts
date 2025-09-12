import { CategoryResponse } from './category';

// Product Entity Types
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId?: number;
  quantity: number;
  status: 'available' | 'sold_out';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product Request Types
export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId?: number;
  quantity?: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  categoryId?: number;
  isActive?: boolean;
}

// Product Response Types
export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId: number | null;
  category: CategoryResponse | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSummary {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  categoryId: number | null;
  category: CategoryResponse | null;
}

// Product Filter Types
export interface ProductFilters {
  categoryId?: number;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}
