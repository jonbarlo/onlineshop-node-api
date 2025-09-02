// Email Template Types
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email Request Types
export interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  data?: Record<string, any>;
}

// Email Response Types
export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email Template Data Types
export interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface NewOrderNotificationData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  totalAmount: number;
  itemCount: number;
}
