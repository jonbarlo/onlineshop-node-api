# Multiple Images per Product - Frontend Implementation Guide

## 🎯 **Feature Overview**

The SimpleShop API now supports **multiple images per product** with advanced management capabilities. This feature allows:

- **Multiple Images**: Products can have unlimited images (with practical limits)
- **Primary Image Selection**: One image can be marked as the primary display image
- **Image Ordering**: Images can be reordered via drag-and-drop or manual ordering
- **Admin Management**: Full CRUD operations for image management
- **Public Display**: Clean API for displaying product image galleries
- **Backward Compatibility**: Existing single `imageUrl` field still works

---

## 📡 **API Endpoints**

### **Public Endpoints (No Authentication Required)**

#### **1. Get Product Images**
```http
GET /api/products/{productId}/images
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalImages": 3,
    "primaryImage": {
      "id": 1,
      "productId": 4,
      "imageUrl": "https://example.com/image1.jpg",
      "altText": "Product front view",
      "sortOrder": 0,
      "isPrimary": true,
      "isActive": true,
      "createdAt": "2025-09-13T05:19:17.124Z",
      "updatedAt": "2025-09-13T05:19:17.124Z"
    },
    "images": [
      {
        "id": 1,
        "productId": 4,
        "imageUrl": "https://example.com/image1.jpg",
        "altText": "Product front view",
        "sortOrder": 0,
        "isPrimary": true,
        "isActive": true,
        "createdAt": "2025-09-13T05:19:17.124Z",
        "updatedAt": "2025-09-13T05:19:17.124Z"
      },
      {
        "id": 2,
        "productId": 4,
        "imageUrl": "https://example.com/image2.jpg",
        "altText": "Product side view",
        "sortOrder": 1,
        "isPrimary": false,
        "isActive": true,
        "createdAt": "2025-09-13T05:19:57.728Z",
        "updatedAt": "2025-09-13T05:19:57.728Z"
      }
    ]
  }
}
```

#### **2. Get Product Details (Now Includes Images)**
```http
GET /api/products/{productId}
```

**New Fields Added:**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "name": "Product Name",
    "description": "Product description",
    "price": 9800,
    "imageUrl": "https://example.com/old-image.jpg", // Deprecated - use images array
    "categoryId": 1,
    "category": { /* category object */ },
    "quantity": 10,
    "status": "available",
    "isActive": true,
    "images": [ /* array of image objects */ ],
    "primaryImage": { /* primary image object */ },
    "createdAt": "2025-09-13T05:19:17.124Z",
    "updatedAt": "2025-09-13T05:19:17.124Z"
  }
}
```

### **Admin Endpoints (Authentication Required)**

#### **3. List Product Images (Admin)**
```http
GET /api/admin/products/{productId}/images
Authorization: Bearer {token}
```

#### **4. Add Image to Product**
```http
POST /api/admin/products/{productId}/images
Authorization: Bearer {token}
Content-Type: application/json

{
  "imageUrl": "https://example.com/new-image.jpg",
  "altText": "Product back view",
  "sortOrder": 2,
  "isPrimary": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "productId": 4,
    "imageUrl": "https://example.com/new-image.jpg",
    "altText": "Product back view",
    "sortOrder": 2,
    "isPrimary": false,
    "isActive": true,
    "createdAt": "2025-09-13T05:21:00.000Z",
    "updatedAt": "2025-09-13T05:21:00.000Z"
  }
}
```

#### **5. Update Image**
```http
PUT /api/admin/products/{productId}/images/{imageId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "altText": "Updated description",
  "sortOrder": 1,
  "isPrimary": true,
  "isActive": true
}
```

#### **6. Delete Image (Soft Delete)**
```http
DELETE /api/admin/products/{productId}/images/{imageId}
Authorization: Bearer {token}
```

#### **7. Reorder Images**
```http
PUT /api/admin/products/{productId}/images/reorder
Authorization: Bearer {token}
Content-Type: application/json

{
  "imageIds": [3, 1, 2] // New order
}
```

---

## 🎨 **Frontend Implementation Suggestions**

### **1. Product Gallery Component**

```typescript
interface ProductGalleryProps {
  productId: number;
  showThumbnails?: boolean;
  autoPlay?: boolean;
  showFullscreen?: boolean;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({
  productId,
  showThumbnails = true,
  autoPlay = false,
  showFullscreen = true
}) => {
  const [images, setImages] = useState<Image[]>([]);
  const [primaryImage, setPrimaryImage] = useState<Image | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch product images
  useEffect(() => {
    fetchProductImages(productId)
      .then(data => {
        setImages(data.images);
        setPrimaryImage(data.primaryImage);
        setCurrentIndex(0);
      });
  }, [productId]);

  // Fallback to old imageUrl if no images
  const displayImage = primaryImage || fallbackImage;

  return (
    <div className="product-gallery">
      {/* Main Image Display */}
      <div className="main-image">
        <img 
          src={images[currentIndex]?.imageUrl || displayImage?.imageUrl} 
          alt={images[currentIndex]?.altText || displayImage?.altText}
        />
      </div>

      {/* Thumbnail Navigation */}
      {showThumbnails && images.length > 1 && (
        <div className="thumbnails">
          {images.map((image, index) => (
            <button
              key={image.id}
              className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            >
              <img src={image.imageUrl} alt={image.altText} />
            </button>
          ))}
        </div>
      )}

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button 
            className="nav-arrow prev"
            onClick={() => setCurrentIndex(prev => 
              prev === 0 ? images.length - 1 : prev - 1
            )}
          >
            ‹
          </button>
          <button 
            className="nav-arrow next"
            onClick={() => setCurrentIndex(prev => 
              prev === images.length - 1 ? 0 : prev + 1
            )}
          >
            ›
          </button>
        </>
      )}
    </div>
  );
};
```

### **2. Admin Image Management Component**

```typescript
interface AdminImageManagerProps {
  productId: number;
  onImagesChange?: (images: Image[]) => void;
}

const AdminImageManager: React.FC<AdminImageManagerProps> = ({
  productId,
  onImagesChange
}) => {
  const [images, setImages] = useState<Image[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch current images
  useEffect(() => {
    fetchAdminProductImages(productId)
      .then(setImages);
  }, [productId]);

  // Add new image
  const handleAddImage = async (imageData: CreateImageData) => {
    setIsUploading(true);
    try {
      const newImage = await addProductImage(productId, imageData);
      setImages(prev => [...prev, newImage]);
      onImagesChange?.(images);
    } finally {
      setIsUploading(false);
    }
  };

  // Update image
  const handleUpdateImage = async (imageId: number, updates: UpdateImageData) => {
    const updatedImage = await updateProductImage(productId, imageId, updates);
    setImages(prev => prev.map(img => 
      img.id === imageId ? updatedImage : img
    ));
    onImagesChange?.(images);
  };

  // Delete image
  const handleDeleteImage = async (imageId: number) => {
    await deleteProductImage(productId, imageId);
    setImages(prev => prev.filter(img => img.id !== imageId));
    onImagesChange?.(images);
  };

  // Reorder images
  const handleReorderImages = async (newOrder: number[]) => {
    await reorderProductImages(productId, newOrder);
    // Refresh images to get updated order
    const updatedImages = await fetchAdminProductImages(productId);
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  return (
    <div className="admin-image-manager">
      <h3>Product Images</h3>
      
      {/* Add Image Form */}
      <ImageUploadForm 
        onAdd={handleAddImage}
        isUploading={isUploading}
      />

      {/* Images List */}
      <div className="images-list">
        {images.map((image, index) => (
          <ImageItem
            key={image.id}
            image={image}
            index={index}
            onUpdate={(updates) => handleUpdateImage(image.id, updates)}
            onDelete={() => handleDeleteImage(image.id)}
            onSetPrimary={() => handleUpdateImage(image.id, { isPrimary: true })}
          />
        ))}
      </div>

      {/* Drag & Drop Reordering */}
      <DragDropReorder 
        items={images}
        onReorder={handleReorderImages}
      />
    </div>
  );
};
```

### **3. API Service Functions**

```typescript
// API service functions
export const productImageAPI = {
  // Public endpoints
  getProductImages: async (productId: number): Promise<ProductImagesSummary> => {
    const response = await fetch(`/api/products/${productId}/images`);
    const data = await response.json();
    return data.data;
  },

  // Admin endpoints
  getAdminProductImages: async (productId: number, token: string): Promise<Image[]> => {
    const response = await fetch(`/api/admin/products/${productId}/images`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    return data.data;
  },

  addProductImage: async (productId: number, imageData: CreateImageData, token: string): Promise<Image> => {
    const response = await fetch(`/api/admin/products/${productId}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(imageData)
    });
    const data = await response.json();
    return data.data;
  },

  updateProductImage: async (productId: number, imageId: number, updates: UpdateImageData, token: string): Promise<Image> => {
    const response = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    const data = await response.json();
    return data.data;
  },

  deleteProductImage: async (productId: number, imageId: number, token: string): Promise<void> => {
    await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  reorderProductImages: async (productId: number, imageIds: number[], token: string): Promise<Image[]> => {
    const response = await fetch(`/api/admin/products/${productId}/images/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ imageIds })
    });
    const data = await response.json();
    return data.data;
  }
};
```

---

## 🎯 **Key Features to Implement**

### **1. Product Gallery**
- **Main Image Display**: Show primary image or first image
- **Thumbnail Navigation**: Click to switch between images
- **Navigation Arrows**: Previous/Next buttons
- **Fullscreen Mode**: Click to view full-size images
- **Auto-play**: Optional slideshow functionality
- **Touch/Swipe Support**: Mobile-friendly navigation

### **2. Admin Image Management**
- **Upload Interface**: Drag & drop or file picker
- **Image Preview**: Thumbnail previews with edit options
- **Primary Image Selection**: Visual indicator and toggle
- **Drag & Drop Reordering**: Reorder images by dragging
- **Bulk Operations**: Select multiple images for batch actions
- **Image Metadata**: Edit alt text, sort order
- **Delete Confirmation**: Prevent accidental deletions

### **3. Mobile Optimization**
- **Responsive Gallery**: Adapt to different screen sizes
- **Touch Gestures**: Swipe to navigate images
- **Performance**: Lazy loading for large image sets
- **Bandwidth**: Optimize image sizes for mobile

---

## 🔧 **Technical Considerations**

### **1. Performance**
- **Lazy Loading**: Load images as needed
- **Image Optimization**: Use appropriate sizes for thumbnails
- **Caching**: Cache image data to reduce API calls
- **Pagination**: For products with many images

### **2. Error Handling**
- **Fallback Images**: Use placeholder when images fail to load
- **Network Errors**: Handle offline/connection issues
- **Invalid URLs**: Validate image URLs before display
- **Permission Errors**: Handle admin authentication failures

### **3. User Experience**
- **Loading States**: Show spinners during image operations
- **Progress Indicators**: For image uploads
- **Success/Error Messages**: Clear feedback for user actions
- **Undo Functionality**: Allow reverting changes

---

## 📱 **Mobile-Specific Features**

### **1. Touch Interactions**
```typescript
const useTouchGestures = () => {
  const [startX, setStartX] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleTouchStart = (e: TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    
    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0) {
        // Swipe left - next image
        setCurrentIndex(prev => Math.min(prev + 1, maxImages - 1));
      } else {
        // Swipe right - previous image
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      }
    }
  };

  return { handleTouchStart, handleTouchEnd };
};
```

### **2. Responsive Gallery Layout**
```css
.product-gallery {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.main-image {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnails {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem 0;
}

.thumbnail {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
}

.thumbnail.active {
  border-color: #007bff;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .thumbnails {
    gap: 0.25rem;
  }
  
  .thumbnail {
    width: 50px;
    height: 50px;
  }
}
```

---

## 🚀 **Implementation Priority**

### **Phase 1: Basic Gallery (High Priority)**
1. Display primary image or first image
2. Show thumbnail navigation
3. Basic previous/next navigation
4. Fallback to old `imageUrl` field

### **Phase 2: Enhanced Gallery (Medium Priority)**
1. Fullscreen mode
2. Touch/swipe gestures
3. Auto-play functionality
4. Loading states and error handling

### **Phase 3: Admin Management (Medium Priority)**
1. Basic image upload
2. Primary image selection
3. Image deletion
4. Alt text editing

### **Phase 4: Advanced Features (Low Priority)**
1. Drag & drop reordering
2. Bulk operations
3. Image optimization
4. Advanced upload features

---

## 🔍 **Testing Checklist**

### **Functional Testing**
- [ ] Images display correctly in gallery
- [ ] Thumbnail navigation works
- [ ] Primary image selection works
- [ ] Image upload/delete operations
- [ ] Reordering functionality
- [ ] Mobile touch gestures
- [ ] Fallback to old imageUrl

### **Performance Testing**
- [ ] Large image sets (10+ images)
- [ ] Slow network conditions
- [ ] Mobile device performance
- [ ] Memory usage with many images

### **Error Handling**
- [ ] Network failures
- [ ] Invalid image URLs
- [ ] Authentication errors
- [ ] Server errors (500, 404, etc.)

---

## 📞 **Support & Questions**

For technical questions about the API endpoints or implementation, refer to:
- **API Documentation**: `/docs/MULTIPLE_IMAGES_FEATURE.md`
- **HTTP Test Files**: `/http/product-images.http`
- **Backend Implementation**: Check the API source code

---

**Happy coding! 🎉**

*This feature provides a solid foundation for building rich, interactive product galleries that will enhance the user experience significantly.*
