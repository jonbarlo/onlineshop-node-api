// Product Variant Types
export interface ProductVariant {
  id: number;
  productId: number;
  color: string;
  size: string;
  quantity: number;
  sku: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product Variant Request Types
export interface CreateProductVariantRequest {
  productId: number;
  color: string;
  size: string;
  quantity: number;
  sku?: string; // Optional - will be auto-generated if not provided
}

export interface UpdateProductVariantRequest {
  color?: string;
  size?: string;
  quantity?: number;
  sku?: string;
  isActive?: boolean;
}

// Product Variant Response Types
export interface ProductVariantResponse {
  id: number;
  productId: number;
  color: string;
  size: string;
  quantity: number;
  sku: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Order Item with Variant Types
export interface OrderItemWithVariant {
  id: number;
  productId: number;
  productVariantId?: number;
  quantity: number;
  unitPrice: number;
  selectedColor?: string;
  selectedSize?: string;
  product: {
    id: number;
    name: string;
    imageUrl?: string;
  };
  productVariant?: ProductVariantResponse;
}
