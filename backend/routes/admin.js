const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { validateProduct, validatePagination } = require('../middleware/validation');
const { sendResponse, sendError } = require('../utils/helpers');
const {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getStats
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', getStats);

// @desc    Create product
// @route   POST /api/admin/products
// @access  Private/Admin
router.post('/products', validateProduct, createProduct);

// @desc    Update product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
router.put('/products/:id', updateProduct);

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
router.delete('/products/:id', deleteProduct);

// @desc    Get all products for admin
// @route   GET /api/admin/products
// @access  Private/Admin
router.get('/products', getProducts);

// @desc    Get all orders for admin
// @route   GET /api/admin/orders
// @access  Private/Admin
router.get('/orders', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;

    // Search filter
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sort]: sortOrder };

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get orders
    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('items.product', 'name media')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

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
    console.error('Get admin orders error:', error);
    sendError(res, 500, 'Error retrieving orders');
  }
});

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, trackingNumber, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 400, 'Invalid status');
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    // Update order
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (notes) order.notes = notes;

    // Set delivery date if status is delivered
    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    await order.save();

    sendResponse(res, 200, { order }, 'Order status updated successfully');
  } catch (error) {
    console.error('Update order status error:', error);
    sendError(res, 500, 'Error updating order status');
  }
});

// @desc    Get all customers for admin
// @route   GET /api/admin/customers
// @access  Private/Admin
router.get('/customers', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter
    const filter = { role: 'user' };
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sort]: sortOrder };

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get customers
    const customers = await User.find(filter)
      .select('-password -refreshTokens')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const totalCustomers = await User.countDocuments(filter);

    // Get order counts for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orderCount = await Order.countDocuments({ user: customer._id });
        const totalSpent = await Order.aggregate([
          {
            $match: {
              user: customer._id,
              status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total' }
            }
          }
        ]);

        return {
          ...customer.toObject(),
          orderCount,
          totalSpent: totalSpent[0]?.total || 0
        };
      })
    );

    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(totalCustomers / limitNum),
      totalCustomers,
      hasNext: pageNum < Math.ceil(totalCustomers / limitNum),
      hasPrev: pageNum > 1
    };

    sendResponse(res, 200, { customers: customersWithStats, pagination }, 'Customers retrieved successfully');
  } catch (error) {
    console.error('Get admin customers error:', error);
    sendError(res, 500, 'Error retrieving customers');
  }
});

module.exports = router;