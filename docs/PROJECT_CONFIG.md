# SimpleShop API - Project Configuration & Rules

## 🎯 Project Overview
**SimpleShop** - Direct Payment & Order Management System API
- **Type**: Node.js + TypeScript REST API
- **Database**: SQL Server (via Prisma ORM)
- **Deployment**: Mochahost (IIS/iisnode)
- **Architecture**: Enterprise-grade, scalable, secure

## 📋 MVP Scope (Revised)
Based on analysis, the MVP should focus on:

### ✅ **INCLUDED Features:**
1. **Product Catalog** (Read-only for customers)
   - View all products
   - View individual product details
   - Product images and descriptions

2. **Shopping Cart & Orders**
   - Add/remove items from cart
   - Place orders with customer details
   - Order status tracking

3. **Admin Panel**
   - Secure login
   - View and manage orders
   - Update order status (New → Paid → Ready for Delivery)
   - **NO product creation/editing** (products managed externally)

4. **Email Notifications**
   - Order confirmation to customer
   - New order notification to manager

### ❌ **EXCLUDED from MVP:**
- Product CRUD operations (admin will manage products externally)
- User registration/login for customers
- Payment processing (manual Sinpe Movil)
- Inventory management
- Product reviews/ratings

## 🏗️ Project Structure

```
simpleshop-api/
├── .env                    # Environment variables (never commit)
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── web.config             # IIS/iisnode configuration
├── PROJECT_CONFIG.md      # This file - project rules
├── MOCHAHOST-QUICKSTART.md # Deployment guide
├── prisma/               # Prisma schema and migrations
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seed file
├── src/                   # TypeScript source code
│   ├── app.ts            # Main application entry point
│   ├── config/           # Configuration files
│   │   ├── database.ts   # Prisma client configuration
│   │   ├── email.ts      # Email service configuration
│   │   └── index.ts      # Config exports
│   ├── api/              # API route handlers
│   │   ├── products.ts   # Product endpoints
│   │   ├── orders.ts     # Order endpoints
│   │   ├── auth.ts       # Authentication endpoints
│   │   └── admin.ts      # Admin endpoints
│   ├── middlewares/      # Express middlewares
│   │   ├── auth.ts       # JWT authentication
│   │   ├── error.ts      # Error handling
│   │   ├── validation.ts # Request validation
│   │   └── cors.ts       # CORS configuration
│   ├── services/         # Business logic services
│   │   ├── email.ts      # Email service
│   │   ├── order.ts      # Order business logic
│   │   └── product.ts    # Product business logic
│   ├── types/            # TypeScript type definitions
│   │   ├── auth.ts       # Authentication types
│   │   ├── order.ts      # Order types
│   │   ├── product.ts    # Product types
│   │   └── api.ts        # API response types
│   └── utils/            # Utility functions
│       ├── logger.ts     # Logging utility
│       ├── validation.ts # Validation helpers
│       └── constants.ts  # Application constants
├── dist/                 # Compiled JavaScript (never edit)
├── uploads/              # File uploads directory
└── tests/                # Test files
    ├── unit/             # Unit tests
    └── integration/      # Integration tests
```

## 🔧 Technical Conventions

### **TypeScript Conventions:**
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Use type guards for runtime type checking
- Prefer `interface` over `type` for object shapes
- Use enums for constants
- Export types from dedicated type files

### **Node.js Conventions:**
- Use async/await over callbacks
- Implement proper error handling
- Use environment variables for configuration
- Follow RESTful API design principles
- Use HTTP status codes correctly
- Implement request validation

### **Database Conventions:**
- Use Prisma ORM with TypeScript
- Single Prisma client instance (shared across app)
- Define schema in `prisma/schema.prisma`
- Use Prisma migrations for schema changes
- Use Prisma Studio for database management

### **API Conventions:**
- RESTful endpoints with proper HTTP methods
- Consistent response format
- Proper error handling and status codes
- Request/response validation
- JWT authentication for protected routes

## 🛡️ Security Rules

1. **Authentication:**
   - JWT tokens with expiration
   - Secure password hashing (bcrypt)
   - Protected admin routes

2. **Data Validation:**
   - Input validation on all endpoints
   - SQL injection prevention (Sequelize ORM)
   - XSS protection

3. **Environment Security:**
   - Never commit `.env` files
   - Use strong secrets
   - Rotate secrets regularly

## 📊 Database Schema

### **Products Table:**
```sql
- id (Primary Key)
- name (VARCHAR)
- description (TEXT)
- price (DECIMAL)
- image_url (VARCHAR)
- is_active (BOOLEAN)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### **Orders Table:**
```sql
- id (Primary Key)
- order_number (VARCHAR, Unique)
- customer_name (VARCHAR)
- customer_email (VARCHAR)
- customer_phone (VARCHAR)
- delivery_address (TEXT)
- status (ENUM: 'new', 'paid', 'ready_for_delivery')
- total_amount (DECIMAL)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### **Order Items Table:**
```sql
- id (Primary Key)
- order_id (Foreign Key)
- product_id (Foreign Key)
- quantity (INTEGER)
- unit_price (DECIMAL)
- created_at (DATETIME)
```

### **Users Table (Admin):**
```sql
- id (Primary Key)
- username (VARCHAR, Unique)
- email (VARCHAR, Unique)
- password_hash (VARCHAR)
- is_active (BOOLEAN)
- created_at (DATETIME)
- updated_at (DATETIME)
```

## 🚀 Development Workflow

1. **Setup:**
   ```bash
   npm install
   cp .env.example .env
   # Configure .env with your values
   ```

2. **Development:**
   ```bash
   npm run dev        # Start with nodemon
   npm run build      # Build TypeScript
   npm run test       # Run tests
   npm run db:generate # Generate Prisma client
   npm run db:push    # Push schema to database
   npm run db:seed    # Seed database with sample data
   ```

3. **Deployment:**
   ```bash
   npm run build
   npm run deploy:mochahost
   ```

## 📝 API Endpoints

### **Public Endpoints:**
- `GET /api/products` - List all active products
- `GET /api/products/:id` - Get product details
- `POST /api/orders` - Create new order

### **Admin Endpoints (Protected):**
- `POST /api/auth/login` - Admin login
- `GET /api/admin/orders` - List all orders
- `GET /api/admin/orders/:id` - Get order details
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/dashboard` - Dashboard statistics

## 🔄 Order Status Flow
1. **New** - Order just placed
2. **Paid** - Payment confirmed via Sinpe Movil
3. **Ready for Delivery** - Order prepared for courier

## 📧 Email Notifications
- **Customer**: Order confirmation with details
- **Manager**: New order notification with customer contact info

---

**This configuration ensures a maintainable, scalable, and secure enterprise-grade API following Node.js and TypeScript best practices.**
