const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, adminOnly } = require('../middleware/auth');
const { sendResponse, sendError } = require('../utils/helpers');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Private/Admin
router.post('/image', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No image file provided');
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    sendResponse(res, 200, {
      imageUrl: `${req.protocol}://${req.get('host')}${imageUrl}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    }, 'Image uploaded successfully');
  } catch (error) {
    console.error('Upload image error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 400, 'File size too large. Maximum size is 5MB');
    }
    
    if (error.message === 'Only image files are allowed') {
      return sendError(res, 400, error.message);
    }
    
    sendError(res, 500, 'Error uploading image');
  }
});

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Private/Admin
router.post('/images', protect, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, 'No image files provided');
    }

    const uploadedImages = req.files.map(file => ({
      imageUrl: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size
    }));

    sendResponse(res, 200, {
      images: uploadedImages,
      count: uploadedImages.length
    }, 'Images uploaded successfully');
  } catch (error) {
    console.error('Upload images error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 400, 'One or more files are too large. Maximum size is 5MB per file');
    }
    
    if (error.message === 'Only image files are allowed') {
      return sendError(res, 400, error.message);
    }
    
    sendError(res, 500, 'Error uploading images');
  }
});

// @desc    Delete uploaded image
// @route   DELETE /api/upload/:filename
// @access  Private/Admin
router.delete('/:filename', protect, adminOnly, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return sendError(res, 404, 'Image not found');
    }

    // Delete file
    fs.unlinkSync(filePath);

    sendResponse(res, 200, null, 'Image deleted successfully');
  } catch (error) {
    console.error('Delete image error:', error);
    sendError(res, 500, 'Error deleting image');
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 400, 'File size too large. Maximum size is 5MB');
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return sendError(res, 400, 'Too many files. Maximum is 5 files');
    }
    return sendError(res, 400, `Upload error: ${error.message}`);
  }
  
  next(error);
});

module.exports = router;