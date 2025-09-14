# Multiple Images per Product - Feature Implementation

## 🎯 **Overview**
This document outlines the implementation of multiple images per product feature for the SimpleShop API, following enterprise-grade Node.js conventions.

## 📋 **Requirements**
- Support multiple images per product
- Maintain backward compatibility with existing `imageUrl` field
- Provide CRUD operations for product images
- Support image ordering and primary image selection
- Enterprise-grade validation and error handling

## 🗄️ **Database Schema Changes**

### **New Table: ProductImage**
```prisma
model ProductImage {
  id          Int      @id @default(autoincrement())
  productId   Int      @map("product_id")
  imageUrl    String   @map("image_url") @db.VarChar(500)
  altText     String?  @map("alt_text") @db.VarChar(255)
  sortOrder   Int      @default(0) @map("sort_order")
  isPrimary   Boolean  @default(false) @map("is_primary")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([isActive])
  @@map("product_images")
}
```

### **Updated Product Model**
```prisma
model Product {
  // ... existing fields
  images      ProductImage[]
  // Keep imageUrl for backward compatibility (deprecated)
}
```

## 🔧 **TypeScript Types**

### **Core Interfaces**
```typescript
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
```

### **Updated Product Response**
```typescript
export interface ProductResponse {
  // ... existing fields
  images: ProductImage[];
  primaryImage?: ProductImage; // Computed field
  // imageUrl: string; // Keep for backward compatibility
}
```

## 🌐 **API Endpoints**

### **Admin Endpoints (Protected)**
```
GET    /api/admin/products/:id/images           // List product images
POST   /api/admin/products/:id/images           // Add image to product
PUT    /api/admin/products/:id/images/:imageId  // Update image
DELETE /api/admin/products/:id/images/:imageId  // Delete image
PUT    /api/admin/products/:id/images/reorder   // Reorder images
POST   /api/admin/products/:id/images/upload    // Upload multiple images
```

### **Public Endpoints**
```
GET    /api/products/:id/images                 // Get product images (public)
```

## 📝 **API Specifications**

### **1. List Product Images**
```http
GET /api/admin/products/1/images
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "productId": 1,
      "imageUrl": "https://example.com/image1.jpg",
      "altText": "Product front view",
      "sortOrder": 0,
      "isPrimary": true,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### **2. Add Image to Product**
```http
POST /api/admin/products/1/images
Authorization: Bearer <token>
Content-Type: application/json

{
  "imageUrl": "https://example.com/image2.jpg",
  "altText": "Product side view",
  "sortOrder": 1,
  "isPrimary": false
}
```

### **3. Update Image**
```http
PUT /api/admin/products/1/images/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "altText": "Updated product view",
  "sortOrder": 2,
  "isPrimary": true
}
```

### **4. Delete Image**
```http
DELETE /api/admin/products/1/images/1
Authorization: Bearer <token>
```

### **5. Reorder Images**
```http
PUT /api/admin/products/1/images/reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "imageIds": [3, 1, 2] // New order
}
```

### **6. Upload Multiple Images**
```http
POST /api/admin/products/1/images/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- files: File[] (multiple files)
- altTexts: string[] (optional)
- sortOrders: number[] (optional)
```

## 🔒 **Business Rules**

### **Primary Image Rules**
- Only one image can be primary per product
- If no primary image exists, the first image (by sortOrder) is considered primary
- Setting an image as primary automatically unsets other primary images

### **Sort Order Rules**
- Images are ordered by `sortOrder` (ascending), then by `createdAt`
- Sort order can be any integer value
- Reordering updates all affected images

### **Validation Rules**
- Image URL must be valid HTTP/HTTPS URL
- Alt text max length: 255 characters
- Image URL max length: 500 characters
- Product must exist before adding images
- Cannot delete primary image if it's the only image

### **Cascade Rules**
- Deleting a product deletes all associated images
- Soft delete: Images can be marked as inactive instead of deleted

## 🚀 **Implementation Phases**

### **Phase 1: Database & Types**
1. Update Prisma schema
2. Run migration
3. Update TypeScript types
4. Regenerate Prisma client

### **Phase 2: Core API Endpoints**
1. Implement CRUD operations
2. Add validation middleware
3. Implement business logic
4. Add error handling

### **Phase 3: Advanced Features**
1. Image reordering
2. Multiple file upload
3. Image optimization
4. CDN integration

### **Phase 4: Testing & Documentation**
1. Unit tests
2. Integration tests
3. API documentation
4. Migration scripts

## 🔄 **Migration Strategy**

### **Backward Compatibility**
- Keep existing `imageUrl` field in Product model
- Existing products continue to work
- Gradual migration to new image system

### **Data Migration**
```sql
-- Migrate existing imageUrl to ProductImage table
INSERT INTO product_images (product_id, image_url, is_primary, sort_order, is_active, created_at, updated_at)
SELECT id, image_url, true, 0, true, created_at, updated_at
FROM products
WHERE image_url IS NOT NULL AND image_url != '';
```

## 🛡️ **Security Considerations**

### **Image Validation**
- Validate image file types (JPEG, PNG, WebP)
- Check file sizes (max 5MB per image)
- Scan for malicious content
- Validate image dimensions

### **Rate Limiting**
- Limit image uploads per minute
- Limit total images per product
- Implement abuse detection

### **Access Control**
- Admin-only access to image management
- Public read-only access to product images
- Audit logging for image changes

## 📊 **Performance Considerations**

### **Database Optimization**
- Index on `productId` and `isActive`
- Efficient queries for image ordering
- Pagination for large image sets

### **CDN Integration**
- Use CDN for image delivery
- Image resizing and optimization
- Lazy loading support

### **Caching**
- Cache product images in Redis
- Cache image metadata
- Implement cache invalidation

## 🧪 **Testing Strategy**

### **Unit Tests**
- Image CRUD operations
- Business logic validation
- Error handling scenarios

### **Integration Tests**
- API endpoint testing
- Database operations
- File upload functionality

### **Performance Tests**
- Bulk image operations
- Large image set handling
- Concurrent upload testing

## 📚 **Documentation Updates**

### **API Documentation**
- Update OpenAPI/Swagger specs
- Add example requests/responses
- Document error codes

### **Developer Guide**
- Migration instructions
- Usage examples
- Best practices

### **User Manual**
- Admin interface updates
- Image management workflow
- Troubleshooting guide

## 🎯 **Success Criteria**

### **Functional Requirements**
- ✅ Multiple images per product
- ✅ Image ordering and primary selection
- ✅ CRUD operations for images
- ✅ Backward compatibility
- ✅ File upload support

### **Non-Functional Requirements**
- ✅ < 200ms response time for image operations
- ✅ Support for 50+ images per product
- ✅ 99.9% uptime for image operations
- ✅ Secure file upload validation
- ✅ Comprehensive error handling

## 📅 **Timeline**

- **Week 1**: Database schema and types
- **Week 2**: Core API endpoints
- **Week 3**: Advanced features and testing
- **Week 4**: Documentation and deployment

## 🔧 **Dependencies**

### **New Packages**
- `multer` - File upload handling
- `sharp` - Image processing
- `joi` - Advanced validation

### **Updated Packages**
- `@prisma/client` - Database client
- `express` - API framework
- `typescript` - Type definitions

---

**Last Updated**: 2025-09-12
**Version**: 1.0.0
**Status**: Implementation Ready
