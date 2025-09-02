// Product Entity Types
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
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
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isActive?: boolean;
}

// Product Response Types
export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSummary {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
}
