# HTTP Test Files

This folder contains HTTP test files for testing all SimpleShop API endpoints. These files can be used with various HTTP clients like:

- **VS Code REST Client** (recommended)
- **IntelliJ HTTP Client**
- **Postman** (import the files)
- **Thunder Client** (VS Code extension)

## Files Overview

### `health.http`
- Health check endpoint tests
- Basic connectivity verification

### `auth.http`
- Authentication endpoint tests
- Login with valid/invalid credentials
- Error handling tests

### `products.http`
- Public product endpoint tests
- Product listing with pagination and search
- Individual product retrieval

### `orders.http`
- Order creation tests
- Various order scenarios (valid/invalid data)
- Error handling for order creation

### `admin.http`
- Admin endpoint tests (requires authentication)
- Order management operations
- Product management operations
- Dashboard statistics
- Authorization tests

### `all-endpoints.http`
- Complete test suite with all endpoints
- Sequential testing workflow
- Variable usage for dynamic testing

## How to Use

### With VS Code REST Client Extension

1. Install the "REST Client" extension in VS Code
2. Open any `.http` file
3. Click "Send Request" above each request
4. View responses in the output panel

### With IntelliJ HTTP Client

1. Open any `.http` file in IntelliJ
2. Click the green arrow next to each request
3. View responses in the HTTP Client tool window

### Testing Workflow

1. **Start with `health.http`** - Verify API is running
2. **Run `auth.http`** - Get authentication token
3. **Test `products.http`** - Verify product endpoints
4. **Create orders with `orders.http`** - Test order creation
5. **Use `admin.http`** - Test admin functionality
6. **Run `all-endpoints.http`** - Complete test suite

## Authentication

Most admin endpoints require a JWT token. The test files use variables to handle this:

1. Login first to get a token
2. The token is automatically stored in the `@token` variable
3. Subsequent requests use `Authorization: Bearer {{token}}`

## Default Test Data

- **Admin Credentials**: `admin` / `admin123`
- **Sample Products**: 3 products are seeded by default
- **Test Orders**: Create test orders with realistic data

## Environment Variables

Make sure your `.env` file is configured with:
- `DATABASE_URL` - SQL Server connection
- `JWT_SECRET` - JWT signing secret
- `MANAGER_EMAIL` - Email for notifications

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Token expired or invalid
   - Solution: Re-run the login request to get a new token

2. **404 Not Found**: Endpoint doesn't exist
   - Solution: Check the API routes in the source code

3. **500 Internal Server Error**: Server-side error
   - Solution: Check server logs and database connection

4. **Connection Refused**: Server not running
   - Solution: Start the server with `npm run dev`

### Server Not Running

If you get connection errors, make sure the server is running:

```bash
npm run dev
```

The server should start on `http://localhost:3000`

## Adding New Tests

To add new test cases:

1. Create a new `.http` file or add to existing ones
2. Follow the existing format and naming conventions
3. Include both success and error scenarios
4. Use variables for dynamic values (IDs, tokens, etc.)
5. Add comments explaining the test purpose

## Example Request Format

```http
### Test Description
POST http://localhost:3000/api/endpoint
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "field": "value"
}
```
