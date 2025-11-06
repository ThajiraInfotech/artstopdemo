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
VITE_BACKEND_URL=https://your-backend.onrender.com
```

## Deployment Checklist

### Pre-Deployment
- [ ] Test application locally with production environment variables
- [ ] Run `npm test` if tests exist
- [ ] Check all API endpoints work correctly
- [ ] Verify email sending works
- [ ] Test payment integration
- [ ] Check image upload functionality

### Backend Deployment (Render)
- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Set all environment variables
- [ ] Deploy and note the URL
- [ ] Test health endpoint: `https://your-backend.onrender.com/api/health`

### Frontend Deployment (Netlify)
- [ ] Create Netlify account
- [ ] Connect GitHub repository
- [ ] Set `VITE_BACKEND_URL` to Render backend URL
- [ ] Deploy and note the URL
- [ ] Test the application

### Post-Deployment
- [ ] Update `FRONTEND_URL` in Render with Netlify URL
- [ ] Redeploy backend on Render
- [ ] Test complete user flow:
  - Registration/Login
  - Add to cart
  - Checkout process
  - Admin panel
- [ ] Verify email OTP functionality
- [ ] Test payment flow (use test cards)

## Security Considerations

### JWT Secrets
- Generate cryptographically secure random strings
- Use at least 256 bits (64 characters)
- Rotate secrets periodically
- Never commit to version control

### Admin Credentials
- Use strong password
- Consider using environment-specific admin accounts
- Monitor admin login activity

### CORS Configuration
- Only allow your frontend domain
- Use HTTPS in production
- Implement proper CORS headers

### Database Security
- Enable MongoDB Atlas authentication
- IP whitelist (consider `0.0.0.0/0` for Render)
- Regular backups
- Monitor database usage

## Monitoring & Maintenance

### Logs
- Monitor Render backend logs
- Check Netlify build/deploy logs
- Set up error tracking (Sentry, LogRocket)

### Performance
- Monitor response times
- Check database query performance
- Optimize images and assets
- Implement caching where appropriate

### Backups
- MongoDB Atlas automatic backups
- Regular code repository backups
- Environment variable backups

## Troubleshooting Production Issues

### Common Issues
1. **CORS errors**: Check `FRONTEND_URL` matches Netlify domain
2. **Token issues**: Clear browser localStorage, check JWT secrets
3. **Email not sending**: Verify Gmail app password
4. **Payment failures**: Check Razorpay test/live mode
5. **Image uploads failing**: Verify Cloudinary credentials

### Debug Steps
1. Check browser developer console for errors
2. Review Render/Netlify deployment logs
3. Test API endpoints directly
4. Verify environment variables are set correctly
5. Check MongoDB Atlas connectivity

## Cost Optimization

### Render (Backend)
- Free tier: 750 hours/month
- Monitor usage to avoid overages
- Consider paid plans for production traffic

### Netlify (Frontend)
- Free tier: 100GB bandwidth/month
- Generous build minutes
- Paid plans for high-traffic sites

### MongoDB Atlas
- Free tier: 512MB storage
- Monitor storage usage
- Upgrade when approaching limits

### Other Services
- Cloudinary: Generous free tier
