# SimpleShop API - Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Create `.env.prod` file with production values
- [ ] Update `DATABASE_URL` with production SQL Server details
- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Update `ADMIN_PASSWORD` to a strong password
- [ ] Configure email settings (SMTP credentials)
- [ ] Set `CORS_ORIGIN` to your production domain
- [ ] Set `BASE_URL` to your production domain

### 2. Database Setup
- [ ] SQL Server database created
- [ ] Database user with proper permissions
- [ ] Run `npm run db:push` to create tables
- [ ] Run `npm run db:seed` to create admin user and sample data

### 3. File Structure Verification
- [ ] All source files in `src/` folder
- [ ] Prisma schema in `prisma/` folder
- [ ] `web.config` properly configured
- [ ] `package.json` with all dependencies
- [ ] TypeScript configuration ready

### 4. FTP Configuration
- [ ] FTP credentials in `.env` file:
  - `FTP_HOST`
  - `FTP_USER`
  - `FTP_PASSWORD`
  - `FTP_PORT` (optional, default: 21)
  - `FTP_SECURE` (optional, default: false)
  - `FTP_REMOTE_PATH` (optional, default: /)

## 🚀 Deployment Steps

### 1. Deploy Files
```bash
npm run deploy:mochahost
```

### 2. On Server (Plesk Console)
```bash
# Install dependencies
npm install --production

# Build the application
npm run build

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed initial data
npm run db:seed
```

### 3. Environment Setup
- [ ] Copy `.env.prod` to `.env` on server
- [ ] Update `.env` with actual production values
- [ ] Restart IIS application in Plesk

## 🧪 Post-Deployment Testing

### 1. Basic Health Check
```bash
curl https://your-domain.com/health
```

### 2. API Endpoints Test
- [ ] `GET /api/products` - Product listing
- [ ] `POST /api/orders` - Create order
- [ ] `POST /api/auth/login` - Admin login
- [ ] `GET /api/admin/orders` - Admin orders (with JWT)

### 3. Database Verification
- [ ] Check if tables were created
- [ ] Verify admin user exists
- [ ] Test sample products are loaded

## 📁 Files Included in Deployment

### Core Files:
- `package.json` - Dependencies and scripts
- `package-lock.json` - Locked dependency versions
- `web.config` - IIS/iisnode configuration
- `tsconfig.json` - TypeScript configuration
- `LICENSE` - License file
- `README.md` - Documentation

### Source Code:
- `src/` - All TypeScript source files
- `prisma/` - Database schema and migrations
- `http/` - API testing files
- `docs/` - Documentation

### Environment:
- `.env.prod` - Production environment template (copied to `.env`)

## 🔧 Production Environment Variables

Create `.env.prod` with these values:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL="sqlserver://user:password@host:1433/database?schema=public&trustServerCertificate=true"

# JWT Configuration
JWT_SECRET=your-very-long-random-secret-key
JWT_EXPIRES_IN=1h

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@simpleshop.com
ADMIN_PASSWORD=your-secure-password

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Manager Email
MANAGER_EMAIL=manager@simpleshop.com

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# CORS
CORS_ORIGIN=https://your-domain.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Base URL
BASE_URL=https://your-domain.com
```

## 🚨 Common Issues & Solutions

### 1. Database Connection Issues
- Check `DATABASE_URL` format
- Ensure `trustServerCertificate=true` is included
- Verify database user permissions

### 2. Build Errors
- Ensure Node.js version compatibility
- Check if all dependencies are installed
- Verify TypeScript compilation

### 3. IIS/iisnode Issues
- Check `web.config` configuration
- Verify Node.js path in `web.config`
- Check IIS logs for errors

### 4. Environment Variables
- Ensure `.env` file is in project root (not in `dist/`)
- Check all required variables are set
- Verify no typos in variable names

## 📞 Support

If you encounter issues:
1. Check server logs in Plesk
2. Verify all environment variables
3. Test database connection
4. Check IIS application status

---

**Ready for deployment! Follow this checklist step by step.**
