const crypto = require('crypto');
const Order = require('../models/Order');
const { sendResponse, sendError } = require('../utils/helpers');

// @desc    Handle Razorpay webhook
// @route   POST /api/webhooks/razorpay
// @access  Public (but verified by Razorpay signature)
const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return sendError(res, 401, 'Invalid webhook signature');
    }

    const event = req.body;
    console.log('Webhook event received:', event.event);

    switch (event.event) {
      case 'payment.authorized':
        await handlePaymentAuthorized(event.payload.payment);
        break;

      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment);
        break;

      case 'refund.created':
        await handleRefundCreated(event.payload.refund);
        break;

      case 'refund.processed':
        await handleRefundProcessed(event.payload.refund);
        break;

      default:
        console.log('Unhandled webhook event:', event.event);
    }

    // Always return 200 to acknowledge receipt
    sendResponse(res, 200, { received: true }, 'Webhook received successfully');

  } catch (error) {
    console.error('Webhook processing error:', error);
    sendError(res, 500, 'Webhook processing failed');
  }
};

// Handle payment authorized
const handlePaymentAuthorized = async (payment) => {
  try {
    console.log('Payment authorized:', payment.id);

    // Find order by Razorpay order ID
    const order = await Order.findOne({
      'paymentInfo.razorpayOrderId': payment.order_id
    });

    if (!order) {
      console.error('Order not found for payment:', payment.id);
      return;
    }

    // Update payment info
    order.paymentInfo.status = 'completed';
    order.paymentInfo.razorpayPaymentId = payment.id;
    order.paymentInfo.paidAt = new Date(payment.created_at * 1000);
    order.status = 'confirmed';

    await order.save();
    console.log('Order updated for authorized payment:', order._id);

  } catch (error) {
    console.error('Error handling payment authorized:', error);
  }
};

// Handle payment captured
const handlePaymentCaptured = async (payment) => {
  try {
    console.log('Payment captured:', payment.id);

    // Find order by Razorpay order ID
    const order = await Order.findOne({
      'paymentInfo.razorpayOrderId': payment.order_id
    });

    if (!order) {
      console.error('Order not found for payment:', payment.id);
      return;
    }

    // Update payment info
    order.paymentInfo.status = 'completed';
    order.paymentInfo.razorpayPaymentId = payment.id;
    order.paymentInfo.paidAt = new Date(payment.created_at * 1000);
    order.status = 'confirmed';

    await order.save();
    console.log('Order updated for captured payment:', order._id);

  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
};

// Handle payment failed
const handlePaymentFailed = async (payment) => {
  try {
    console.log('Payment failed:', payment.id);

    // Find order by Razorpay order ID
    const order = await Order.findOne({
      'paymentInfo.razorpayOrderId': payment.order_id
    });

    if (!order) {
      console.error('Order not found for payment:', payment.id);
      return;
    }

    // Update payment info
    order.paymentInfo.status = 'failed';
    order.paymentInfo.transactionId = payment.id;
    order.status = 'cancelled';

    await order.save();
    console.log('Order updated for failed payment:', order._id);

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
};

// Handle refund created
const handleRefundCreated = async (refund) => {
  try {
    console.log('Refund created:', refund.id);

    // Find order by payment ID
    const order = await Order.findOne({
      'paymentInfo.razorpayPaymentId': refund.payment_id
    });

    if (!order) {
      console.error('Order not found for refund:', refund.id);
      return;
    }

    // Update order status
    order.status = 'refunded';
    order.paymentInfo.status = 'refunded';
    order.paymentInfo.razorpayRefundId = refund.id;
    order.paymentInfo.refundAmount = refund.amount / 100; // Convert from paise to rupees

    await order.save();
    console.log('Order updated for refund created:', order._id);

  } catch (error) {
    console.error('Error handling refund created:', error);
  }
};

// Handle refund processed
const handleRefundProcessed = async (refund) => {
  try {
    console.log('Refund processed:', refund.id);

    // Find order by payment ID
    const order = await Order.findOne({
      'paymentInfo.razorpayPaymentId': refund.payment_id
    });

    if (!order) {
      console.error('Order not found for refund:', refund.id);
      return;
    }

    // Update order status
    order.paymentInfo.status = 'refunded';
    order.paymentInfo.razorpayRefundId = refund.id;
    order.paymentInfo.refundedAt = new Date();
    order.paymentInfo.refundAmount = refund.amount / 100; // Convert from paise to rupees

    await order.save();
    console.log('Order updated for refund processed:', order._id);

  } catch (error) {
    console.error('Error handling refund processed:', error);
  }
};

module.exports = {
  handleRazorpayWebhook
};