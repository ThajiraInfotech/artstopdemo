const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { validateOrder } = require('../middleware/validation');
const { sendResponse, sendError } = require('../utils/helpers');

const router = express.Router();

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Build filter
    const filter = { user: req.user.id };
    if (status) filter.status = status;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get orders
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('items.product', 'name images');

    const totalOrders = await Order.countDocuments(filter);

    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(totalOrders / limitNum),
      totalOrders,
      hasNext: pageNum < Math.ceil(totalOrders / limitNum),
      hasPrev: pageNum > 1
    };

    sendResponse(res, 200, { orders, pagination }, 'Orders retrieved successfully');
  } catch (error) {
    console.error('Get orders error:', error);
    sendError(res, 500, 'Error retrieving orders');
  }
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('items.product', 'name images');

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    sendResponse(res, 200, { order }, 'Order retrieved successfully');
  } catch (error) {
    console.error('Get order error:', error);
    sendError(res, 500, 'Error retrieving order');
  }
});

// @desc    Create order (Checkout)
// @route   POST /api/orders
// @access  Private
router.post('/', protect, validateOrder, async (req, res) => {
  try {
    const { shippingAddress, paymentInfo } = req.body;

    // Get user cart
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name images price inStock');

    if (!cart || cart.items.length === 0) {
      return sendError(res, 400, 'Cart is empty');
    }

    // Verify all products are still available
    for (let item of cart.items) {
      if (!item.product || !item.product.inStock) {
        return sendError(res, 400, `Product ${item.product?.name || 'Unknown'} is no longer available`);
      }
    }

    // Create order items
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images[0],
      quantity: item.quantity,
      variant: item.variant,
      color: item.color,
      price: item.price,
      total: item.total
    }));

    // Create order
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentInfo: {
        method: paymentInfo.method,
        status: paymentInfo.method === 'cod' ? 'pending' : 'completed',
        transactionId: paymentInfo.transactionId,
        paidAt: paymentInfo.method !== 'cod' ? new Date() : undefined
      },
      subtotal: cart.subtotal,
      tax: cart.tax,
      shipping: cart.shipping,
      total: cart.total,
      status: 'confirmed'
    });

    // Update product sales count
    for (let item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { sales: item.quantity } }
      );
    }

    // Clear cart after successful order
    cart.items = [];
    await cart.save();

    // Populate order for response
    const populatedOrder = await Order.findById(order._id)
      .populate('items.product', 'name images');

    sendResponse(res, 201, { order: populatedOrder }, 'Order created successfully');
  } catch (error) {
    console.error('Create order error:', error);
    sendError(res, 500, 'Error creating order');
  }
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
      return sendError(res, 400, 'Order cannot be cancelled at this stage');
    }

    order.status = 'cancelled';
    await order.save();

    sendResponse(res, 200, { order }, 'Order cancelled successfully');
  } catch (error) {
    console.error('Cancel order error:', error);
    sendError(res, 500, 'Error cancelling order');
  }
});

// @desc    Get order tracking
// @route   GET /api/orders/:id/tracking
// @access  Private
router.get('/:id/tracking', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    }).select('orderNumber status trackingNumber estimatedDelivery deliveredAt createdAt');

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    // Generate tracking timeline
    const timeline = [
      {
        status: 'confirmed',
        message: 'Order confirmed',
        date: order.createdAt,
        completed: true
      }
    ];

    if (['processing', 'shipped', 'delivered'].includes(order.status)) {
      timeline.push({
        status: 'processing',
        message: 'Order is being processed',
        date: order.createdAt,
        completed: true
      });
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      timeline.push({
        status: 'shipped',
        message: 'Order shipped',
        date: order.createdAt,
        completed: true
      });
    }

    if (order.status === 'delivered') {
      timeline.push({
        status: 'delivered',
        message: 'Order delivered',
        date: order.deliveredAt,
        completed: true
      });
    }

    sendResponse(res, 200, {
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery
      },
      timeline
    }, 'Order tracking retrieved successfully');
  } catch (error) {
    console.error('Get order tracking error:', error);
    sendError(res, 500, 'Error retrieving order tracking');
  }
});

module.exports = router;