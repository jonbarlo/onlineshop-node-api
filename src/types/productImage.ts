// Product Image Entity Types
export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product Image Request Types
export interface CreateProductImageRequest {
  imageUrl: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface UpdateProductImageRequest {
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface ReorderImagesRequest {
  imageIds: number[];
}

// Product Image Response Types
export interface ProductImageResponse {
  id: number;
  productId: number;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Upload Request Types
export interface UploadImagesRequest {
  altTexts?: string[];
  sortOrders?: number[];
  isPrimary?: number; // Index of which image should be primary
}

// Product Images Summary
export interface ProductImagesSummary {
  totalImages: number;
  primaryImage?: ProductImageResponse | undefined;
  images: ProductImageResponse[];
}
