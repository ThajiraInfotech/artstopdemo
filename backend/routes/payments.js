const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createRazorpayOrder,
  verifyPayment,
  processRefund,
  getPaymentDetails
} = require('../controllers/paymentController');

const router = express.Router();

// All payment routes require authentication
router.use(protect);

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
router.post('/create-order', createRazorpayOrder);

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private
router.post('/verify', verifyPayment);

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private
router.post('/refund', processRefund);

// @desc    Get payment details
// @route   GET /api/payments/:orderId
// @access  Private
router.get('/:orderId', getPaymentDetails);

module.exports = router;