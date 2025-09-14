import { CategoryResponse } from './category';
import { ProductImageResponse } from './productImage';

// Product Entity Types
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId?: number;
  quantity: number;
  colors: string[];
  sizes: string[];
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
  colors?: string[];
  sizes?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  categoryId?: number;
  quantity?: number;
  colors?: string[];
  sizes?: string[];
  isActive?: boolean;
}

// Product Response Types
export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string; // Deprecated - kept for backward compatibility
  categoryId: number | null;
  category: CategoryResponse | null;
  quantity: number;
  colors: string[];
  sizes: string[];
  status: 'available' | 'sold_out';
  isActive: boolean;
  images: ProductImageResponse[];
  primaryImage?: ProductImageResponse | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSummary {
  id: number;
  name: string;
  price: number;
  imageUrl?: string; // Deprecated - kept for backward compatibility
  categoryId: number | null;
  category: CategoryResponse | null;
  quantity: number;
  colors: string[];
  sizes: string[];
  status: 'available' | 'sold_out';
  primaryImage?: ProductImageResponse | undefined;
}

// Product Filter Types
export interface ProductFilters {
  categoryId?: number;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  colors?: string[];
  sizes?: string[];
}
