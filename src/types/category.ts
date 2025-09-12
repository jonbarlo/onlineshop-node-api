// Category Entity Types
export interface Category {
  id: number;
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Category Request Types
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  slug: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  slug?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// Category Response Types
export interface CategoryResponse {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  id: number;
  name: string;
  slug: string;
  productCount?: number;
}

// Product with Category Types
export interface ProductWithCategory {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId?: number;
  category?: CategoryResponse;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithCategoryResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId?: number;
  category?: CategoryResponse;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
