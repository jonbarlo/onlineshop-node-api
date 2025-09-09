# SimpleShop API - Frontend Developer Documentation

## 🚀 Quick Start

**Base URL:** `https://your-domain.com` (production) or `http://localhost:3000` (development)

**Authentication:** JWT tokens for admin endpoints

**Content-Type:** `application/json`

---

## 📋 API Overview

### Public Endpoints (No Authentication Required)
- Product catalog browsing
- Order creation
- Health check

### Admin Endpoints (JWT Authentication Required)
- Admin login
- Order management
- Product management
- Dashboard analytics

---

## 🔐 Authentication

### Admin Login
**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@simpleshop.com"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Usage:** Store the `token` and include it in the `Authorization` header for protected endpoints:
```
Authorization: Bearer <token>
```

---

## 🛍️ Customer Endpoints

### 1. Health Check
**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "message": "SimpleShop API is running",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Get All Products
**Endpoint:** `GET /api/products`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for product name/description

**Example:** `GET /api/products?page=1&limit=20&search=laptop`

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Sample Product 1",
        "description": "This is a sample product description",
        "price": 29.99,
        "imageUrl": "https://via.placeholder.com/300x300?text=Product+1",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3. Get Product by ID
**Endpoint:** `GET /api/products/:id`

**Response:**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": 1,
    "name": "Sample Product 1",
    "description": "This is a sample product description",
    "price": 29.99,
    "imageUrl": "https://via.placeholder.com/300x300?text=Product+1",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 4. Create Order
**Endpoint:** `POST /api/orders`

**Request:**
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "deliveryAddress": "123 Main St, City, Country",
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": 1,
    "orderNumber": "ORD-20240101-001",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+1234567890",
    "deliveryAddress": "123 Main St, City, Country",
    "status": "new",
    "totalAmount": 89.97,
    "items": [
      {
        "id": 1,
        "productId": 1,
        "quantity": 2,
        "unitPrice": 29.99,
        "product": {
          "id": 1,
          "name": "Sample Product 1",
          "imageUrl": "https://via.placeholder.com/300x300?text=Product+1"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 👨‍💼 Admin Endpoints (JWT Required)

### 1. Get All Orders
**Endpoint:** `GET /api/admin/orders`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (`new`, `paid`, `ready_for_delivery`)
- `search` (optional): Search by customer name/email

**Response:**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "id": 1,
        "orderNumber": "ORD-20240101-001",
        "customerName": "John Doe",
        "customerEmail": "john@example.com",
        "status": "new",
        "totalAmount": 89.97,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Get Order by ID
**Endpoint:** `GET /api/admin/orders/:id`

**Response:**
```json
{
  "success": true,
  "message": "Order retrieved successfully",
  "data": {
    "id": 1,
    "orderNumber": "ORD-20240101-001",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+1234567890",
    "deliveryAddress": "123 Main St, City, Country",
    "status": "new",
    "totalAmount": 89.97,
    "items": [
      {
        "id": 1,
        "productId": 1,
        "quantity": 2,
        "unitPrice": 29.99,
        "product": {
          "id": 1,
          "name": "Sample Product 1",
          "imageUrl": "https://via.placeholder.com/300x300?text=Product+1"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3. Update Order Status
**Endpoint:** `PUT /api/admin/orders/:id/status`

**Request:**
```json
{
  "status": "paid"
}
```

**Valid Statuses:**
- `new` - Order just placed
- `paid` - Payment confirmed
- `ready_for_delivery` - Ready for courier

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "id": 1,
    "orderNumber": "ORD-20240101-001",
    "status": "paid",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 4. Get All Products (Admin View)
**Endpoint:** `GET /api/admin/products`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Sample Product 1",
        "description": "This is a sample product description",
        "price": 29.99,
        "imageUrl": "https://via.placeholder.com/300x300?text=Product+1",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 5. Create Product
**Endpoint:** `POST /api/admin/products`

**Request:**
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 29.99,
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 1,
    "name": "New Product",
    "description": "Product description",
    "price": 29.99,
    "imageUrl": "https://example.com/image.jpg",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 6. Update Product
**Endpoint:** `PUT /api/admin/products/:id`

**Request:**
```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "price": 39.99,
  "imageUrl": "https://example.com/new-image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": 1,
    "name": "Updated Product Name",
    "description": "Updated description",
    "price": 39.99,
    "imageUrl": "https://example.com/new-image.jpg",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 7. Delete Product
**Endpoint:** `DELETE /api/admin/products/:id`

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 8. Get Dashboard Statistics
**Endpoint:** `GET /api/admin/dashboard`

**Response:**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "totalOrders": 150,
    "newOrders": 25,
    "paidOrders": 100,
    "readyForDeliveryOrders": 25,
    "totalRevenue": 15750.50,
    "recentOrders": [
      {
        "id": 1,
        "orderNumber": "ORD-20240101-001",
        "customerName": "John Doe",
        "status": "new",
        "totalAmount": 89.97,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🚨 Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 📱 Frontend Implementation Guide

### 1. Authentication Flow
```javascript
// Login
const login = async (username, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
  }
  return data;
};

// Make authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
};
```

### 2. Product Catalog
```javascript
// Get products with pagination
const getProducts = async (page = 1, limit = 10, search = '') => {
  const params = new URLSearchParams({ page, limit, search });
  const response = await fetch(`/api/products?${params}`);
  return response.json();
};
```

### 3. Shopping Cart & Orders
```javascript
// Create order
const createOrder = async (orderData) => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  return response.json();
};
```

### 4. Admin Order Management
```javascript
// Get orders
const getOrders = async (page = 1, status = '') => {
  const params = new URLSearchParams({ page, status });
  const response = await makeAuthenticatedRequest(`/api/admin/orders?${params}`);
  return response.json();
};

// Update order status
const updateOrderStatus = async (orderId, status) => {
  const response = await makeAuthenticatedRequest(`/api/admin/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
  return response.json();
};
```

---

## 🎯 Order Status Flow

1. **New** - Order just placed by customer
2. **Paid** - Payment confirmed via Sinpe Movil
3. **Ready for Delivery** - Order prepared for courier

---

## 📧 Email Notifications

The API automatically sends:
- **Order confirmation** to customer email
- **New order notification** to manager email

---

## 🔧 Development Notes

- All timestamps are in ISO 8601 format
- Prices are in decimal format (e.g., 29.99)
- Pagination is consistent across all list endpoints
- JWT tokens should be stored securely
- Handle network errors gracefully
- Implement proper loading states
- Validate forms before submission

---

**This API provides everything needed to build a complete e-commerce frontend with customer shopping and admin management capabilities.**
