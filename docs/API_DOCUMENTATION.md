# SimpleShop API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
All admin endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer {your_jwt_token}
```

---

## AUTHENTICATION ENDPOINTS

### Login
**POST** `/api/auth/login`

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
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

---

## PRODUCT ENDPOINTS

### Get All Products (Public)
**GET** `/api/products`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term
- `categoryId` (optional): Filter by category
- `colors` (optional): Comma-separated colors (e.g., "Red,Blue")
- `sizes` (optional): Comma-separated sizes (e.g., "M,L")
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Product Name",
        "description": "Product Description",
        "price": 29.99,
        "imageUrl": "https://example.com/image.jpg",
        "categoryId": 1,
        "category": {
          "id": 1,
          "name": "Category Name"
        },
        "quantity": 100,
        "status": "available",
        "isActive": true,
        "colors": ["Red", "Blue"],
        "sizes": ["M", "L"],
        "variants": [
          {
            "id": 1,
            "color": "Red",
            "size": "M",
            "quantity": 5,
            "sku": "PRODUCT-RED-M",
            "isActive": true
          },
          {
            "id": 2,
            "color": "Blue",
            "size": "L",
            "quantity": 3,
            "sku": "PRODUCT-BLUE-L",
            "isActive": true
          }
        ],
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Get Product by ID (Public)
**GET** `/api/products/{id}`

**Response:** Same as single product object above

### Get Products Summary (Public)
**GET** `/api/products/summary/list`

**Query Parameters:** Same as Get All Products

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Product Name",
        "price": 29.99,
        "imageUrl": "https://example.com/image.jpg",
        "category": "Category Name",
        "status": "available",
        "variants": [
          {
            "id": 1,
            "color": "Red",
            "size": "M",
            "quantity": 5,
            "sku": "PRODUCT-RED-M"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

---

## ADMIN PRODUCT ENDPOINTS

### Get All Products (Admin)
**GET** `/api/admin/products`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:** Same as public products + `status`, `isActive`

**Response:** Same as public products but includes inactive/sold out products

### Get Product by ID (Admin)
**GET** `/api/admin/products/{id}`

**Headers:** `Authorization: Bearer {token}`

**Response:** Same as public product response

### Create Product
**POST** `/api/admin/products`

**Headers:** `Authorization: Bearer {token}`, `Content-Type: application/json`

**Request:**
```json
{
  "name": "Product Name",
  "description": "Product Description",
  "price": 29.99,
  "imageUrl": "https://example.com/image.jpg",
  "categoryId": 1,
  "quantity": 100,
  "colors": ["Red", "Blue"],
  "sizes": ["M", "L"],
  "variants": [
    {
      "color": "Red",
      "size": "M",
      "quantity": 5,
      "sku": "PRODUCT-RED-M"
    },
    {
      "color": "Blue",
      "size": "L",
      "quantity": 3,
      "sku": "PRODUCT-BLUE-L"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "Product Name",
    "description": "Product Description",
    "price": 29.99,
    "imageUrl": "https://example.com/image.jpg",
    "categoryId": 1,
    "quantity": 100,
    "status": "available",
    "isActive": true,
    "colors": ["Red", "Blue"],
    "sizes": ["M", "L"],
    "variants": [
      {
        "id": 1,
        "color": "Red",
        "size": "M",
        "quantity": 5,
        "sku": "PRODUCT-RED-M",
        "isActive": true
      },
      {
        "id": 2,
        "color": "Blue",
        "size": "L",
        "quantity": 3,
        "sku": "PRODUCT-BLUE-L",
        "isActive": true
      }
    ],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Update Product
**PUT** `/api/admin/products/{id}`

**Headers:** `Authorization: Bearer {token}`, `Content-Type: application/json`

**Request:**
```json
{
  "name": "Updated Product Name",
  "description": "Updated Description",
  "price": 39.99,
  "imageUrl": "https://example.com/updated-image.jpg",
  "categoryId": 2,
  "quantity": 150,
  "colors": ["Green", "Yellow"],
  "sizes": ["S", "XL"],
  "variants": [
    {
      "color": "Green",
      "size": "S",
      "quantity": 10,
      "sku": "UPDATED-GREEN-S"
    },
    {
      "color": "Yellow",
      "size": "XL",
      "quantity": 7,
      "sku": "UPDATED-YELLOW-XL"
    }
  ]
}
```

**Important Notes:**
- Sending `variants: []` will DELETE all existing variants
- Omitting `variants` field will keep existing variants unchanged
- All fields are optional - only provided fields will be updated

**Response:** Same as create product response

### Delete Product
**DELETE** `/api/admin/products/{id}`

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## ORDER ENDPOINTS

### Create Order
**POST** `/api/orders`

**Headers:** `Content-Type: application/json`

**Request:**
```json
{
  "items": [
    {
      "productId": 1,
      "selectedColor": "Red",
      "selectedSize": "M",
      "quantity": 2
    },
    {
      "productId": 2,
      "selectedColor": "Blue",
      "selectedSize": "L",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "street": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "ORD-20250101-001",
    "items": [
      {
        "id": 1,
        "productId": 1,
        "productVariantId": 1,
        "selectedColor": "Red",
        "selectedSize": "M",
        "quantity": 2,
        "price": 29.99,
        "product": {
          "id": 1,
          "name": "Product Name",
          "imageUrl": "https://example.com/image.jpg"
        },
        "productVariant": {
          "id": 1,
          "color": "Red",
          "size": "M",
          "sku": "PRODUCT-RED-M"
        }
      }
    ],
    "totalAmount": 59.98,
    "status": "pending",
    "shippingAddress": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Get Order by ID
**GET** `/api/orders/{id}`

**Response:** Same as create order response

---

## ADMIN ORDER ENDPOINTS

### Get All Orders
**GET** `/api/admin/orders`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status
- `search` (optional): Search term

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 1,
        "orderNumber": "ORD-20250101-001",
        "items": [
          {
            "id": 1,
            "productId": 1,
            "productVariantId": 1,
            "selectedColor": "Red",
            "selectedSize": "M",
            "quantity": 2,
            "price": 29.99,
            "product": {
              "id": 1,
              "name": "Product Name",
              "imageUrl": "https://example.com/image.jpg"
            },
            "productVariant": {
              "id": 1,
              "color": "Red",
              "size": "M",
              "sku": "PRODUCT-RED-M"
            }
          }
        ],
        "totalAmount": 59.98,
        "status": "pending",
        "shippingAddress": {
          "street": "123 Main Street",
          "city": "New York",
          "state": "NY",
          "zipCode": "10001",
          "country": "USA"
        },
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Update Order Status
**PUT** `/api/admin/orders/{id}/status`

**Headers:** `Authorization: Bearer {token}`, `Content-Type: application/json`

**Request:**
```json
{
  "status": "paid"
}
```

**Valid Status Values:**
- `pending`
- `paid`
- `ready_for_delivery`
- `shipped`
- `delivered`
- `cancelled`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "paid",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Important:** When status is updated to `paid`, inventory quantities are automatically deducted from the appropriate product variants.

---

## CATEGORY ENDPOINTS

### Get All Categories
**GET** `/api/categories`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic devices and accessories",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## ERROR RESPONSES

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

**Common Error Codes:**
- `INVALID_TOKEN`: Invalid or expired JWT token
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Insufficient permissions
- `INTERNAL_ERROR`: Server error

---

## PRODUCT VARIANTS - CRITICAL IMPLEMENTATION NOTES

### For Frontend Developers:

1. **Always check for `variants` array** in product responses
2. **Use `selectedColor` and `selectedSize`** in order items, NOT `productVariantId`
3. **Check `variants[].quantity`** to determine availability
4. **Handle empty variants array** - means product has no size/color options
5. **Use `variants[].sku`** for inventory tracking
6. **Filter products by `colors` and `sizes`** query parameters
7. **When updating products**, sending `variants: []` deletes all variants
8. **When updating products**, omitting `variants` keeps existing variants

### Variant Data Structure:
```typescript
interface ProductVariant {
  id: number;
  color: string;
  size: string;
  quantity: number;
  sku: string;
  isActive: boolean;
}
```

### Order Item with Variant Selection:
```typescript
interface OrderItem {
  productId: number;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
}
```

---

## TESTING

Use the provided HTTP files in the `/http` directory for testing:
- `auth.http` - Authentication tests
- `products.http` - Product endpoint tests
- `admin.http` - Admin endpoint tests
- `orders.http` - Order endpoint tests
- `product-images.http` - Image upload tests
