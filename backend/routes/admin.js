const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { validateProduct, validatePagination } = require('../middleware/validation');
const { sendResponse, sendError, generateSlug } = require('../utils/helpers');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', async (req, res) => {
  try {
    // Get basic counts
    const [totalProducts, totalCategories, totalOrders, totalUsers] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      Order.countDocuments(),
      User.countDocuments({ role: 'user' })
    ]);

    // Get order statistics
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$total' }
        }
      }
    ]);

    // Get monthly sales data (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
          status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get top selling products
    const topProducts = await Product.find({ isActive: true })
      .sort({ sales: -1 })
      .limit(5)
      .select('name sales price images');

    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .select('orderNumber total status createdAt user');

    // Calculate total revenue
    const totalRevenue = await Order.aggregate([
      {
        $match: {
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

    const stats = {
      totalProducts,
      totalCategories,
      totalOrders,
      totalUsers,
      totalRevenue: totalRevenue[0]?.total || 0,
      orderStats: orderStats.reduce((acc, stat) => {
        acc[stat._id] = { count: stat.count, value: stat.totalValue };
        return acc;
      }, {}),
      monthlySales,
      topProducts,
      recentOrders
    };

    sendResponse(res, 200, stats, 'Dashboard stats retrieved successfully');
  } catch (error) {
    console.error('Get admin stats error:', error);
    sendError(res, 500, 'Error retrieving dashboard stats');
  }
});

// @desc    Create product
// @route   POST /api/admin/products
// @access  Private/Admin
router.post('/products', validateProduct, async (req, res) => {
  try {
    const {
      name,
      category,
      collection,
      description,
      price,
      oldPrice,
      images,
      variants,
      colors,
      features,
      inStock,
      featured,
      tags,
      weight,
      dimensions,
      material
    } = req.body;

    // Check if category exists
    const categoryDoc = await Category.findOne({ slug: category });
    if (!categoryDoc) {
      return sendError(res, 400, 'Category not found');
    }

    // Add collection to category if it doesn't exist
    if (!categoryDoc.collections.includes(collection)) {
      categoryDoc.collections.push(collection);
      
      // Set collection image to first product image
      if (images && images.length > 0) {
        categoryDoc.collectionImages.set(collection, images[0]);
      }
      
      await categoryDoc.save();
    }

    // Create product
    const product = await Product.create({
      name: name.trim(),
      category,
      collection,
      description: description ? description.trim() : '',
      price,
      oldPrice,
      images,
      variants: variants || [],
      colors: colors || [],
      features: features || [],
      inStock: inStock !== undefined ? inStock : true,
      featured: featured !== undefined ? featured : false,
      tags: tags || [],
      weight,
      dimensions,
      material: material ? material.trim() : ''
    });

    // Update category product count
    await categoryDoc.updateProductCount();

    sendResponse(res, 201, { product }, 'Product created successfully');
  } catch (error) {
    console.error('Create product error:', error);
    sendError(res, 500, 'Error creating product');
  }
});

// @desc    Update product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    const {
      name,
      category,
      collection,
      description,
      price,
      oldPrice,
      images,
      variants,
      colors,
      features,
      inStock,
      featured,
      tags,
      weight,
      dimensions,
      material
    } = req.body;

    // Update product fields
    if (name) product.name = name.trim();
    if (category) product.category = category;
    if (collection) product.collection = collection;
    if (description !== undefined) product.description = description.trim();
    if (price) product.price = price;
    if (oldPrice !== undefined) product.oldPrice = oldPrice;
    if (images) product.images = images;
    if (variants) product.variants = variants;
    if (colors) product.colors = colors;
    if (features) product.features = features;
    if (inStock !== undefined) product.inStock = inStock;
    if (featured !== undefined) product.featured = featured;
    if (tags) product.tags = tags;
    if (weight !== undefined) product.weight = weight;
    if (dimensions) product.dimensions = dimensions;
    if (material !== undefined) product.material = material.trim();

    await product.save();

    sendResponse(res, 200, { product }, 'Product updated successfully');
  } catch (error) {
    console.error('Update product error:', error);
    sendError(res, 500, 'Error updating product');
  }
});

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();

    // Update category product count
    const category = await Category.findOne({ slug: product.category });
    if (category) {
      await category.updateProductCount();
    }

    sendResponse(res, 200, null, 'Product deleted successfully');
  } catch (error) {
    console.error('Delete product error:', error);
    sendError(res, 500, 'Error deleting product');
  }
});

// @desc    Get all products for admin
// @route   GET /api/admin/products
// @access  Private/Admin
router.get('/products', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      collection,
      search,
      inStock,
      featured,
      isActive,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    if (category) filter.category = category;
    if (collection) filter.collection = collection;
    if (inStock !== undefined) filter.inStock = inStock === 'true';
    if (featured !== undefined) filter.featured = featured === 'true';
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sort]: sortOrder };

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get products
    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const totalProducts = await Product.countDocuments(filter);

    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
      totalProducts,
      hasNext: pageNum < Math.ceil(totalProducts / limitNum),
      hasPrev: pageNum > 1
    };

    sendResponse(res, 200, { products, pagination }, 'Products retrieved successfully');
  } catch (error) {
    console.error('Get admin products error:', error);
    sendError(res, 500, 'Error retrieving products');
  }
});

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