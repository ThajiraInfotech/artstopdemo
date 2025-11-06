# ArtStop Deployment Guide

## Overview
This guide covers deploying the ArtStop e-commerce application to Render (backend) and Netlify (frontend).

## Backend Deployment (Render)

### Prerequisites
- Render account
- MongoDB Atlas database
- Cloudinary account (for image uploads)
- Razorpay account (for payments)
- Gmail account (for OTP emails)

### Steps

1. **Fork/Clone the repository to your GitHub**

2. **Create a Render Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the backend folder
   - Configure build settings:
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

3. **Set Environment Variables in Render**
   ```
   NODE_ENV=production
   MONGO_URL=your_mongodb_atlas_connection_string
   JWT_SECRET=your_256_bit_jwt_secret
   JWT_REFRESH_SECRET=your_256_bit_refresh_secret
   JWT_EXPIRE=7d
   JWT_REFRESH_EXPIRE=30d
   FRONTEND_URL=https://your-netlify-app.netlify.app
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_APP_PASSWORD=your_gmail_app_password
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_PASSWORD=your_admin_password
   ```

4. **Deploy**
   - Render will automatically build and deploy your backend
   - Note the deployment URL (e.g., `https://artstop-backend.onrender.com`)

## Frontend Deployment (Netlify)

### Prerequisites
- Netlify account
- Backend API URL from Render deployment

### Steps

1. **Deploy to Netlify**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Configure build settings:
     - **Base directory**: `frontend`
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`

2. **Set Environment Variables in Netlify**
   ```
   VITE_BACKEND_URL=https://your-render-backend-url.onrender.com
   ```

3. **Deploy**
   - Netlify will build and deploy your frontend
   - Note the deployment URL (e.g., `https://artstop.netlify.app`)

## Post-Deployment Configuration

### Update CORS Settings
After both deployments are complete, update the `FRONTEND_URL` environment variable in Render to match your Netlify URL:

```
FRONTEND_URL=https://your-netlify-app.netlify.app
```

### Test the Application
1. Visit your Netlify frontend URL
2. Try user registration/login
3. Test adding items to cart
4. Test the admin panel at `/admin/login`

## Environment Variables Reference

### Backend (Render)
- `NODE_ENV`: Set to `production`
- `MONGO_URL`: MongoDB Atlas connection string
- `JWT_SECRET`: 256-bit secret for JWT tokens (generate randomly)
- `JWT_REFRESH_SECRET`: 256-bit secret for refresh tokens
- `JWT_EXPIRE`: Token expiration time (default: 7d)
- `JWT_REFRESH_EXPIRE`: Refresh token expiration (default: 30d)
- `FRONTEND_URL`: Your Netlify frontend URL
- `CLOUDINARY_*`: Cloudinary configuration for image uploads
- `RAZORPAY_*`: Razorpay configuration for payments
- `EMAIL_*`: Gmail SMTP configuration for OTP emails
- `ADMIN_*`: Admin login credentials

### Frontend (Netlify)
- `VITE_BACKEND_URL`: Your Render backend API URL

## Troubleshooting

### Backend Issues
- Check Render logs for any build/startup errors
- Verify all environment variables are set correctly
- Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0`

### Frontend Issues
- Check Netlify build logs for any build errors
- Verify `VITE_BACKEND_URL` is set to the correct Render URL
- Check browser console for CORS or API errors

### Common Issues
- **CORS errors**: Ensure `FRONTEND_URL` in Render matches your Netlify domain
- **Token issues**: Clear browser localStorage and try again
- **Email not sending**: Check Gmail app password and less secure apps settings

## Security Notes
- Never commit `.env` files to version control
- Use strong, randomly generated secrets for JWT tokens
- Regularly rotate JWT secrets in production
- Keep admin credentials secure