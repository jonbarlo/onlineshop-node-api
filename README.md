# SimpleShop API

A modern Node.js + TypeScript REST API for a direct payment and order management system.

## 🚀 Features

- **Product Catalog** - Browse and view products
- **Order Management** - Create and track orders
- **Admin Panel** - Manage orders and update status
- **Email Notifications** - Automatic order confirmations
- **JWT Authentication** - Secure admin access
- **Prisma ORM** - Type-safe database operations
- **Enterprise Architecture** - Scalable and maintainable

## 🛠️ Tech Stack

- **Backend**: Node.js + TypeScript + Express
- **Database**: SQL Server with Prisma ORM
- **Authentication**: JWT tokens
- **Email**: Nodemailer with HTML templates
- **Validation**: Express-validator
- **Logging**: Winston
- **Deployment**: Mochahost (IIS/iisnode)

## 📋 Prerequisites

- Node.js 18+ 
- SQL Server database
- SMTP email service (Gmail, etc.)

## 🚀 Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repo-url>
   cd simpleshop-api
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Set up the database:**
   ```bash
   npm run db:generate  # Generate Prisma client
   npm run db:push      # Push schema to database
   npm run db:seed      # Seed with sample data
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Test the API:**
   - Health check: `GET http://localhost:3000/health`
   - Products: `GET http://localhost:3000/api/products`
   - Admin login: `POST http://localhost:3000/api/auth/login`

🎯 Current API Endpoints Available:
Public Endpoints:
✅ GET /health - Health check
✅ GET /api/products - List all products
✅ GET /api/products/:id - Get product by ID
✅ POST /api/orders - Create new order
Admin Endpoints (JWT Protected):
✅ POST /api/auth/login - Admin login
✅ GET /api/admin/orders - List all orders
✅ GET /api/admin/orders/:id - Get order by ID
✅ PUT /api/admin/orders/:id/status - Update order status
✅ GET /api/admin/dashboard - Dashboard statistics
✅ GET /api/admin/products - List all products (admin view)
✅ POST /api/admin/products - Create new product
✅ PUT /api/admin/products/:id - Update product
✅ DELETE /api/admin/products/:id - Delete product
✅ POST /api/upload/product-image - Upload product image
✅ DELETE /api/upload/product-image/:filename - Delete product image

## 📚 API Endpoints

### Public Endpoints

#### Health Check
- `GET /health` - API health status

#### Products
- `GET /api/products` - List all active products
  - Query params: `page`, `limit`, `search`
- `GET /api/products/:id` - Get product details by ID

#### Orders
- `POST /api/orders` - Create new order
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
      }
    ]
  }
  ```

### Authentication

#### Admin Login
- `POST /api/auth/login` - Admin login
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
  Returns: JWT token for protected endpoints

### Admin Endpoints (Protected - Requires JWT Token)

#### Orders Management
- `GET /api/admin/orders` - List all orders
  - Query params: `page`, `limit`, `status`, `search`
- `GET /api/admin/orders/:id` - Get order details by ID
- `PUT /api/admin/orders/:id/status` - Update order status
  ```json
  {
    "status": "paid"
  }
  ```
  Valid statuses: `new`, `paid`, `ready_for_delivery`

#### Products Management
- `GET /api/admin/products` - List all products (including inactive)
  - Query params: `page`, `limit`
  - Returns: Paginated list with both active and inactive products
- `POST /api/admin/products` - Create new product
  ```json
  {
    "name": "New Product",
    "description": "Product description",
    "price": 29.99,
    "imageUrl": "https://example.com/image.jpg"
  }
  ```
  - Required: `name`, `description`, `price`
  - Optional: `imageUrl`
- `PUT /api/admin/products/:id` - Update product
  ```json
  {
    "name": "Updated Name",
    "description": "Updated description",
    "price": 39.99,
    "imageUrl": "https://example.com/new-image.jpg",
    "isActive": true
  }
  ```
  - All fields optional - only update fields you want to change
- `DELETE /api/admin/products/:id` - Delete product (soft delete)
  - Sets `isActive: false` instead of hard delete

#### File Upload
- `POST /api/upload/product-image` - Upload product image
  - Content-Type: `multipart/form-data`
  - Field: `image` (file)
  - Size limit: 5MB
  - Allowed types: JPEG, JPG, PNG, GIF, WebP
- `DELETE /api/upload/product-image/:filename` - Delete product image

#### Dashboard
- `GET /api/admin/dashboard` - Dashboard statistics
  - Returns: order counts, revenue, recent orders

## 🧪 API Testing

Use the HTTP files in the `http/` folder to test all endpoints:

- `http/auth.http` - Authentication endpoints
- `http/products.http` - Product endpoints  
- `http/orders.http` - Order endpoints
- `http/admin.http` - Admin endpoints

### Default Admin Credentials
- Username: `admin`
- Password: `admin123`

## 🔧 Development

```bash
npm run dev        # Start with nodemon
npm run build      # Build TypeScript
npm run test       # Run tests
npm run lint       # Lint code
npm run db:studio  # Open Prisma Studio
```

## 🚀 Deployment

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Mochahost:**
   ```bash
   npm run deploy:mochahost
   ```

3. **On the server:**
   ```bash
   npm install --production
   npm run build
   ```

## 📊 Database Schema

- **Users** - Admin users
- **Products** - Product catalog
- **Orders** - Customer orders
- **OrderItems** - Order line items

## 🔐 Security

- JWT authentication for admin routes
- Input validation on all endpoints
- SQL injection prevention (Prisma ORM)
- CORS configuration
- Helmet security headers

## 📧 Email Notifications

- Order confirmation emails to customers
- New order notifications to managers
- HTML email templates
- Configurable SMTP settings

## 🎯 Order Flow

1. **New** - Order just placed
2. **Paid** - Payment confirmed via Sinpe Movil
3. **Ready for Delivery** - Order prepared for courier

## 📝 Environment Variables

See `env.example` for all required environment variables.

## 🤝 Contributing

1. Follow TypeScript conventions
2. Use proper error handling
3. Add validation to all endpoints
4. Write tests for new features
5. Update documentation

## 📄 License

MIT License - see LICENSE file for details.
