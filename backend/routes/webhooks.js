const express = require('express');
const { handleRazorpayWebhook } = require('../controllers/webhookController');
const { sendResponse, sendError } = require('../utils/helpers');

const router = express.Router();

// @desc    Handle Razorpay webhook
// @route   POST /api/webhooks/razorpay
// @access  Public (signature verified)
router.post('/razorpay', express.raw({ type: 'application/json' }), handleRazorpayWebhook);

// Health check for webhook endpoint
router.get('/health', (req, res) => {
  sendResponse(res, 200, { status: 'OK', timestamp: new Date().toISOString() }, 'Webhook service is healthy');
});

module.exports = router;