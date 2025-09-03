// Order Status Types
export type OrderStatus = 'new' | 'paid' | 'ready_for_delivery';

export const ORDER_STATUS = {
  NEW: 'new' as const,
  PAID: 'paid' as const,
  READY_FOR_DELIVERY: 'ready_for_delivery' as const,
} as const;

// Order Item Types
export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  product?: {
    id: number;
    name: string;
    imageUrl?: string;
  };
}

// Order Entity Types
export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Order Request Types
export interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  items: {
    productId: number;
    quantity: number;
  }[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

// Order Response Types
export interface OrderResponse {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
}
