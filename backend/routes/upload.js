const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { protect, adminOnly } = require('../middleware/auth');
const { sendResponse, sendError } = require('../utils/helpers');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'artstop', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'webm'],
    resource_type: 'auto' // Auto-detect if it's image or video
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type - allow images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

// Configure multer with Cloudinary storage
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB limit (for videos)
  }
});

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Private/Admin
router.post('/image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No image file provided');
    }

    // Cloudinary provides the full URL in req.file.path
    sendResponse(res, 200, {
      url: req.file.path, // Cloudinary URL
      type: req.file.mimetype.startsWith("video/") ? "video" : "image",
      publicId: req.file.filename, // Cloudinary public ID
      originalName: req.file.originalname,
      size: req.file.size,
      format: req.file.format,
      width: req.file.width,
      height: req.file.height
    }, 'Image uploaded successfully to Cloudinary');
  } catch (error) {
    console.error('Upload image error:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 400, 'File size too large. Maximum size is 200MB');
    }

    if (error.message === 'Only image and video files are allowed') {
      return sendError(res, 400, error.message);
    }

    // Handle Cloudinary specific errors
    if (error.http_code) {
      return sendError(res, error.http_code, `Cloudinary error: ${error.message}`);
    }

    sendError(res, 500, 'Error uploading image to Cloudinary');
  }
});

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Private/Admin
router.post('/images', protect, adminOnly, upload.array('images', 15), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, 'No image files provided');
    }

    const uploadedImages = req.files.map(file => ({
      url: file.path, // Cloudinary URL
      type: file.mimetype.startsWith("video/") ? "video" : "image",
      publicId: file.filename, // Cloudinary public ID
      originalName: file.originalname,
      size: file.size,
      format: file.format,
      width: file.width,
      height: file.height
    }));

    sendResponse(res, 200, {
      images: uploadedImages,
      count: uploadedImages.length
    }, 'Images uploaded successfully to Cloudinary');
  } catch (error) {
    console.error('Upload images error:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 400, 'One or more files are too large. Maximum size is 200MB per file');
    }

    if (error.message === 'Only image and video files are allowed') {
      return sendError(res, 400, error.message);
    }

    // Handle Cloudinary specific errors
    if (error.http_code) {
      return sendError(res, error.http_code, `Cloudinary error: ${error.message}`);
    }

    sendError(res, 500, 'Error uploading images to Cloudinary');
  }
});

// @desc    Delete uploaded image
// @route   DELETE /api/upload/:publicId
// @access  Private/Admin
router.delete('/:publicId', protect, adminOnly, async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return sendError(res, 400, 'Public ID is required');
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      return sendError(res, 404, 'Image not found or already deleted');
    }

    sendResponse(res, 200, {
      publicId: publicId,
      result: result.result
    }, 'Image deleted successfully from Cloudinary');
  } catch (error) {
    console.error('Delete image error:', error);

    // Handle Cloudinary specific errors
    if (error.http_code) {
      return sendError(res, error.http_code, `Cloudinary error: ${error.message}`);
    }

    sendError(res, 500, 'Error deleting image from Cloudinary');
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 400, 'File size too large. Maximum size is 200MB');
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return sendError(res, 400, 'Too many files. Maximum is 15 files');
    }
    return sendError(res, 400, `Upload error: ${error.message}`);
  }
  
  next(error);
});

module.exports = router;