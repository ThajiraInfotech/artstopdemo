# ArtStop Production Environment Setup

## Required Services & Accounts

### 1. MongoDB Atlas
- Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
- Create a free cluster
- Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/artstop`

### 2. Cloudinary (Image Storage)
- Create account at [Cloudinary](https://cloudinary.com)
- Get cloud name, API key, and API secret

### 3. Razorpay (Payment Gateway)
- Create account at [Razorpay](https://razorpay.com)
- Get test/live API keys

### 4. Gmail (Email Service)
- Use existing Gmail account
- Generate App Password:
  1. Go to Google Account settings
  2. Enable 2-factor authentication
  3. Generate App Password for "Mail"
  4. Use the 16-character password

## Environment Variables

### Backend (.env file)
```bash
# Server
NODE_ENV=production
PORT=8001

# Database
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/artstop?retryWrites=true&w=majority

# JWT (Generate random 256-bit secrets)
JWT_SECRET=731c7f78984648db067d0c201d6d1ffa82b5d44f2f5338b22cc359894ce3bba81590be144ad2775bb0814a7dad662643d4aeb2f1ac70b3e3a69e0c8786043bff
JWT_REFRESH_SECRET=3dadb1f93aa77173f34937efc8ceb7d03052a18253b9f6409fde07ce08be5716674d490e61fbb1959c76c0f9358172ce1556ea63473c7bd8bac9cc523fa3972d
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Frontend URL (update after Netlify deployment)
FRONTEND_URL=https://your-app-name.netlify.app

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your_16_char_app_password

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=SecureAdminPass123
```

### Frontend (.env file)
```bash
