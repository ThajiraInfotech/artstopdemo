const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// User registration validation
exports.validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  exports.handleValidationErrors
];

// User login validation
exports.validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  exports.handleValidationErrors
];

// Product validation
exports.validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('collection')
    .trim()
    .notEmpty()
    .withMessage('Collection is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('images')
    .isArray({ min: 1 })
    .withMessage('At least one image is required'),
  body('images.*')
    .isURL()
    .withMessage('Each image must be a valid URL'),
  exports.handleValidationErrors
];

// Category validation
exports.validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('slug')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('image')
    .isURL()
    .withMessage('Image must be a valid URL'),
  exports.handleValidationErrors
];

// Cart item validation
exports.validateCartItem = [
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  exports.handleValidationErrors
];

// Order validation
exports.validateOrder = [
  body('shippingAddress.name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name is required'),
  body('shippingAddress.phone')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian phone number'),
  body('shippingAddress.email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('shippingAddress.street')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Street address is required'),
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 2 })
    .withMessage('City is required'),
  body('shippingAddress.state')
    .trim()
    .isLength({ min: 2 })
    .withMessage('State is required'),
  body('shippingAddress.zipCode')
    .isPostalCode('IN')
    .withMessage('Please provide a valid Indian postal code'),
  body('paymentInfo.method')
    .isIn(['card', 'upi', 'netbanking', 'cod'])
    .withMessage('Invalid payment method'),
  exports.handleValidationErrors
];

// MongoDB ObjectId validation
exports.validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  exports.handleValidationErrors
];

// Query validation for pagination
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  exports.handleValidationErrors
];