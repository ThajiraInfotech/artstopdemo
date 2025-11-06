const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendResponse, sendError } = require('../utils/helpers');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

console.log('Razorpay initialized with Key ID:', process.env.RAZORPAY_KEY_ID ? 'Loaded' : 'Not loaded');

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    // Get user cart
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name images price inStock');

    console.log('Payment debug - User ID:', req.user._id, 'Cart exists:', !!cart, 'Items count:', cart?.items?.length, 'Cart total:', cart?.total);

    if (!cart || cart.items.length === 0) {
      console.log('Cart is empty for user:', req.user._id);
      return sendError(res, 400, 'Cart is empty');
    }

    // Ensure shippingAddress has required fields with fallbacks
    const defaultShippingAddress = {
      name: req.user.name || "Customer",
      email: req.user.email || "customer@example.com",
      phone: req.user.phone || "9999999999",
      street: "",
      city: "",
      state: "",
      zipCode: ""
    };

    const finalShippingAddress = shippingAddress ? { ...defaultShippingAddress, ...shippingAddress } : defaultShippingAddress;

    // Verify all products are still available
    for (let item of cart.items) {
      if (!item.product || !item.product.inStock) {
        return sendError(res, 400, `Product ${item.product?.name || 'Unknown'} is no longer available`);
      }
    }

    // Create order items
    const orderItems = cart.items.map(item => {
      // Get first image from media array
      const productImages = item.product.media ? item.product.media.filter(m => m.type === 'image').map(m => m.url) : [];
      const firstImage = productImages.length > 0 ? productImages[0] : 'https://via.placeholder.com/300x300?text=No+Image';

      const orderItem = {
        product: item.product._id,
        name: item.product.name,
        image: firstImage,
        quantity: item.quantity,
        color: item.color,
        price: item.price,
        total: item.total
      };

      // Only add variant if it exists and has value
      if (item.variant && item.variant.value) {
        orderItem.variant = item.variant;
      }

      return orderItem;
    });

    // Calculate amounts in paise (Razorpay expects amounts in smallest currency unit)
     const amountInPaise = Math.round(cart.total * 100);

     console.log('Payment debug - User ID:', req.user._id, 'Cart total:', cart.total, 'Amount in paise:', amountInPaise);

     // Validate minimum amount (1 INR = 100 paise)
     if (amountInPaise < 100) {
       return sendError(res, 400, 'Order amount must be at least ₹1');
     }

     // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user._id,
        userEmail: req.user.email
      }
    });

    // Generate order number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `ORD-${timestamp}${random}`;

    // Create order in database with pending status
    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      items: orderItems,
      shippingAddress: finalShippingAddress,
      paymentInfo: {
        method: 'razorpay',
        status: 'pending',
        transactionId: razorpayOrder.id,
        razorpayOrderId: razorpayOrder.id
      },
      subtotal: cart.subtotal,
      tax: cart.tax,
      shipping: cart.shipping,
      total: cart.total,
      status: 'pending'
    });

    sendResponse(res, 201, {
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID
    }, 'Razorpay order created successfully');

  } catch (error) {
    console.error('Create Razorpay order error:', error);
    sendError(res, 500, error.message || 'Error creating payment order');
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    // Verify payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return sendError(res, 400, 'Payment verification failed');
    }

    // Find and update order
    const order = await Order.findById(orderId);
    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    // Get user cart to update product sales
    const cart = await Cart.findOne({ user: req.user._id });

    // Update order status
    order.paymentInfo.status = 'completed';
    order.paymentInfo.transactionId = razorpay_payment_id;
    order.paymentInfo.razorpayPaymentId = razorpay_payment_id;
    order.paymentInfo.paidAt = new Date();
    order.status = 'confirmed';
    await order.save();

    // Update product sales count
    if (cart && cart.items) {
      for (let item of cart.items) {
        await Product.findByIdAndUpdate(
          item.product._id,
          { $inc: { sales: item.quantity } }
        );
      }
    }

    // Clear cart after successful payment
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    sendResponse(res, 200, {
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total
      }
    }, 'Payment verified successfully');

  } catch (error) {
    console.error('Verify payment error:', error);
    sendError(res, 500, 'Error verifying payment');
  }
};

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private (User can request, Admin can process)
const processRefund = async (req, res) => {
  try {
    const { orderId, reason, amount } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    // Check if user owns the order or is admin
    if (order.user.toString() !== req.user._id && req.user.role !== 'admin') {
      return sendError(res, 403, 'Not authorized to process refund for this order');
    }

    // Check if order can be refunded
    if (!['confirmed', 'processing', 'shipped'].includes(order.status)) {
      return sendError(res, 400, 'Order cannot be refunded at this stage');
    }

    // Check if already refunded
    if (order.paymentInfo.status === 'refunded') {
      return sendError(res, 400, 'Order already refunded');
    }

    // For users, create refund request
    if (req.user.role !== 'admin') {
      order.status = 'refunded';
      order.paymentInfo.status = 'refunded';
      order.notes = `Refund requested by user: ${reason}`;
      await order.save();

      sendResponse(res, 200, { order }, 'Refund request submitted successfully');
      return;
    }

    // For admin, process actual refund via Razorpay
    const refundAmount = amount ? Math.round(amount * 100) : order.total * 100;

    const refund = await razorpay.payments.refund(razorpay_payment_id, {
      amount: refundAmount,
      notes: {
        reason: reason,
        processedBy: req.user._id
      }
    });

    // Update order status
    order.status = 'refunded';
    order.paymentInfo.status = 'refunded';
    order.paymentInfo.razorpayRefundId = refund.id;
    order.paymentInfo.refundedAt = new Date();
    order.paymentInfo.refundAmount = refund.amount / 100; // Convert from paise to rupees
    order.paymentInfo.refundReason = reason;
    order.notes = `Refund processed: ${reason}`;
    await order.save();

    sendResponse(res, 200, {
      order,
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status
      }
    }, 'Refund processed successfully');

  } catch (error) {
    console.error('Process refund error:', error);
    sendError(res, 500, 'Error processing refund');
  }
};

// @desc    Get payment details
// @route   GET /api/payments/:orderId
// @access  Private
const getPaymentDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    // Check if user owns the order or is admin
    if (order.user.toString() !== req.user._id && req.user.role !== 'admin') {
      return sendError(res, 403, 'Not authorized to view this payment');
    }

    sendResponse(res, 200, {
      paymentInfo: order.paymentInfo,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status
    }, 'Payment details retrieved successfully');

  } catch (error) {
    console.error('Get payment details error:', error);
    sendError(res, 500, 'Error retrieving payment details');
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  processRefund,
  getPaymentDetails
};