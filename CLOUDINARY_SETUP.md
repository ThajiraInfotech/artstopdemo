# Cloudinary Setup Guide for ArtStop

This guide will help you set up Cloudinary for image storage in your ArtStop application.

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address
4. Log in to your Cloudinary dashboard

## Step 2: Get Your Cloudinary Credentials

1. In your Cloudinary dashboard, go to "Account" → "Settings"
2. Scroll down to find your "Account Details":
   - **Cloud Name**: This is your unique cloud name (e.g., `dxyz12345`)
   - **API Key**: Your API key (e.g., `123456789012345`)
   - **API Secret**: Your API secret (keep this secure!)

## Step 3: Configure Environment Variables

Update your `backend/.env` file with your Cloudinary credentials:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here
```

**Security Note**: Never commit your `.env` file to version control. Add it to `.gitignore`.

## Step 4: Understanding Cloudinary Features

### Free Tier Benefits (Perfect for ArtStop):
- 25GB storage
- 25GB monthly bandwidth
- 25,000 monthly transformations
- Automatic format optimization
- CDN delivery worldwide

### Key Features for ArtStop:
- **Image Optimization**: Automatic compression and format conversion
- **Responsive Images**: Generate different sizes automatically
- **Transformations**: Resize, crop, add effects on-the-fly
- **Secure Delivery**: HTTPS URLs with CDN
- **Admin Panel**: Web-based media library management

## Step 5: How Cloudinary Works in ArtStop

### Upload Process:
1. User uploads image through your app
2. Image is sent to Cloudinary API
3. Cloudinary processes and stores the image
4. You get back a secure CDN URL
5. URL is saved in your database

### URL Structure:
```
https://res.cloudinary.com/{cloud_name}/image/upload/v{timestamp}/{public_id}.{format}
```

Example:
```
https://res.cloudinary.com/artstop/image/upload/v1234567890/artwork_001.jpg
```

### Transformations:
You can modify images on-the-fly by adding parameters to the URL:

- **Resize**: `w_300,h_300,c_fill` (300x300, cropped to fill)
- **Quality**: `q_80` (80% quality)
- **Format**: `f_auto` (automatic format selection)

Example transformed URL:
```
https://res.cloudinary.com/artstop/image/upload/w_300,h_300,c_fill,q_80,f_auto/v1234567890/artwork_001.jpg
```

## Step 6: Testing Your Setup

1. Start your backend server: `npm run dev`
2. Use a tool like Postman or your frontend to test image upload
3. Check your Cloudinary dashboard to see uploaded images
4. Verify the returned URLs work in your browser

## Step 7: Production Considerations

### Environment Variables:
Make sure to set these in your production environment (Render/Vercel):
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Security:
- Use environment variables, never hardcode credentials
- Consider using signed uploads for additional security
- Set up proper CORS policies if needed

### Cost Management:
- Monitor your usage in the Cloudinary dashboard
- Consider upgrading plans as your app grows
- Use transformations wisely to optimize bandwidth

## Troubleshooting

### Common Issues:

1. **"Invalid credentials" error**:
   - Double-check your cloud name, API key, and secret
   - Ensure no extra spaces in environment variables

2. **Upload fails**:
   - Check file size limits (Cloudinary default is 10MB for free tier)
   - Verify file format is supported

3. **Images not displaying**:
   - Check if URLs are HTTPS (required for modern browsers)
   - Verify cloud name in the URL is correct

### Getting Help:
- Cloudinary Documentation: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- Community Forums: [https://community.cloudinary.com/](https://community.cloudinary.com/)
- Support: Available through your Cloudinary dashboard

## Next Steps

Once Cloudinary is set up, your ArtStop application will have:
- Reliable image storage with global CDN
- Automatic image optimization
- Better performance and user experience
- Professional image management capabilities

Happy uploading! 🎨📸