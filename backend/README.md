# ArtStop E-commerce Backend API

A production-ready Node.js + Express backend for the ArtStop e-commerce platform with MongoDB database and JWT authentication.

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Role-based access control (User/Admin)
- Secure password hashing with bcryptjs
- Admin-only routes protection

### Product Management
- Complete CRUD operations for products
- Category and collection management
- Product variants (sizes, dimensions, pricing)
- Color options and product images
- Search and filtering capabilities
- Pagination support

### Shopping Cart & Orders
- User cart management
- Order creation and tracking
- Order status updates (Admin)
- Order history

### File Upload
- Local file upload with Multer
- Image optimization and validation
- Cloudinary integration ready

### Security Features
- Helmet for security headers
- CORS configuration
- Rate limiting
- Input sanitization (XSS, NoSQL injection)
- Request validation with express-validator

## 📋 API Endpoints

### Authentication Routes (`/api/auth`)
```
POST   /register         - User registration
POST   /login           - User login
POST   /admin/login     - Admin login
POST   /refresh         - Refresh JWT token
POST   /logout          - User logout
GET    /me              - Get current user profile
PUT    /profile         - Update user profile
PUT    /change-password - Change user password
POST   /forgot-password - Request password reset
PUT    /reset-password/:token - Reset password with token
```

### Product Routes (`/api/products`)
```
GET    /                    - Get all products (with filtering & search)
GET    /featured/list       - Get featured products
GET    /category/:category  - Get products by category
GET    /search/:query       - Search products
GET    /:identifier         - Get single product by ID or slug
```

### Category Routes (`/api/categories`)
```
GET    /                              - Get all categories
GET    /:slug                         - Get category by slug
GET    /:category/collections/:collection - Get products by collection
POST   /                              - Create category (Admin)
PUT    /:id                           - Update category (Admin)
DELETE /:id                           - Delete category (Admin)
```

### Cart Routes (`/api/cart`)
```
GET    /           - Get user cart
POST   /           - Add item to cart
PUT    /:itemId    - Update cart item quantity
DELETE /:itemId    - Remove item from cart
DELETE /           - Clear entire cart
GET    /count      - Get cart items count
```

### Order Routes (`/api/orders`)
```
GET    /              - Get user orders
GET    /:id           - Get single order
POST   /              - Create order (checkout)
PUT    /:id/cancel    - Cancel order
GET    /:id/tracking  - Get order tracking
```

### Admin Routes (`/api/admin`)
```
GET    /stats           - Dashboard statistics
GET    /products        - Get all products (Admin)
POST   /products        - Create product
PUT    /products/:id    - Update product
DELETE /products/:id    - Delete product
GET    /orders          - Get all orders (Admin)
PUT    /orders/:id/status - Update order status
GET    /customers       - Get all customers
```

### Upload Routes (`/api/upload`)
```
POST   /image          - Upload single image (Admin)
POST   /images         - Upload multiple images (Admin)
DELETE /:filename      - Delete uploaded image (Admin)
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16+)
- MongoDB
- npm or yarn

### 1. Install Dependencies
```bash
cd backend
npm install
# or
yarn install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
MONGO_URL=mongodb://localhost:27017/artstop
JWT_SECRET=your-super-secret-jwt-key
ADMIN_EMAIL=admin@artstop.com
ADMIN_PASSWORD=admin123
```

### 3. Database Setup
```bash
# Seed the database with initial data
npm run seed
```

This creates:
- Admin user: `admin@artstop.com` / `admin123`
- Sample user: `user@example.com` / `user123`
- 4 Categories with collections
- 6 Sample products

### 4. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:8001`

## 🔧 Frontend Integration

### API Base URL
```javascript
const API_BASE_URL = 'http://localhost:8001/api';
```

### Authentication Example
```javascript
// Login
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'user123'
  })
});

const data = await response.json();
// Store token: data.data.token
```

### Authenticated Requests
```javascript
// Get user orders
const response = await fetch(`${API_BASE_URL}/orders`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Product Fetching
```javascript
// Get all products with filtering
const response = await fetch(
  `${API_BASE_URL}/products?page=1&limit=12&category=islamic-art&sort=price&order=asc`
);

// Get single product
const response = await fetch(`${API_BASE_URL}/products/product-slug-or-id`);
```

### Cart Management
```javascript
// Add to cart
const response = await fetch(`${API_BASE_URL}/cart`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productId: '507f1f77bcf86cd799439011',
    quantity: 1,
    variant: 'medium',
    color: 'Gold'
  })
});
```

## 📱 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    // Validation errors (if any)
  ]
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS**: Configured for frontend URL
- **Input Validation**: express-validator for all inputs
- **Data Sanitization**: Protection against XSS and NoSQL injection
- **Security Headers**: Helmet middleware

## 🚀 Production Deployment

### Option 1: Render Deployment (Recommended)

#### 1. Create a Render Account
- Sign up at [render.com](https://render.com)
- Connect your GitHub repository

#### 2. Create a Web Service
- Click "New" → "Web Service"
- Connect your GitHub repo
- Set the following configuration:
  ```
  Runtime: Node
  Build Command: npm install
  Start Command: npm start
  Environment: Production
  ```

#### 3. Environment Variables
Set these in Render dashboard:
```env
NODE_ENV=production
PORT=10000
MONGO_URL=mongodb+srv://your-mongodb-atlas-connection-string
JWT_SECRET=your-production-jwt-secret-key
JWT_REFRESH_SECRET=your-production-refresh-secret-key
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
FRONTEND_URL=https://artsop-frontend.netlify.app
ADMIN_EMAIL=admin@artstop.com
ADMIN_PASSWORD=your-secure-admin-password
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

#### 4. Database Setup
- Create a MongoDB Atlas account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
- Create a free cluster
- Get your connection string and whitelist Render's IP addresses
- Update the `MONGO_URL` environment variable

#### 5. Deploy
- Push your code to GitHub
- Render will automatically deploy your application
- Your API will be available at `https://your-app-name.onrender.com`

### Option 2: Docker Deployment

#### Local Development with Docker
```bash
# Start the application with MongoDB
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop the application
docker-compose down
```

#### Production Docker Deployment
```bash
# Build the image
docker build -t artstop-backend .

# Run the container
docker run -d \
  --name artstop-api \
  -p 8001:8001 \
  -e NODE_ENV=production \
  -e MONGO_URL=your-mongodb-url \
  -e JWT_SECRET=your-jwt-secret \
  -e FRONTEND_URL=https://artsop-frontend.netlify.app \
  artstop-backend
```

### Option 3: PM2 Process Manager
```bash
npm install -g pm2
pm2 start server.js --name "artstop-api"
pm2 startup
pm2 save
```

## 📊 Database Schema

### Models
- **User**: Authentication and user data
- **Category**: Product categories with collections
- **Product**: Product information with variants
- **Cart**: User shopping cart
- **Order**: Order management and tracking

### Indexes
- Text search on products (name, description, tags)
- Compound indexes for efficient filtering
- User-specific indexes for cart and orders

## 🧪 Testing

### API Testing
Use the provided Postman collection or test with curl:

```bash
# Health check
curl http://localhost:8001/api/health

# Get products
curl http://localhost:8001/api/products

# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"user123"}'
```

## 📞 Support

For issues and questions:
- Check the API documentation above
- Review error messages in the console
- Ensure all environment variables are set correctly
- Verify MongoDB connection

## 📄 License

MIT License - see LICENSE file for details.