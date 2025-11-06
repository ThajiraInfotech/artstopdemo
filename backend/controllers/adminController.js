const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');

// Create Product
const createProduct = async (req, res) => {
  try {
    console.log("Incoming product payload:", req.body);

    // Ensure optional fields are safe defaults
    const {
      name,
      category,
      collection,
      price,
      media = [],
      description = "",
      colors = [],
      features = [],
      inStock = true,
      featured = false,
      variants = []
    } = req.body;

    // Check if category exists
    const categoryDoc = await Category.findOne({ slug: category });
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Add collection to category if it doesn't exist
    if (!categoryDoc.collections.includes(collection)) {
      categoryDoc.collections.push(collection);

      // Set collection image to first product image
      if (media && media.length > 0) {
        const firstImage = media.find(m => m.type === 'image');
        if (firstImage) {
          categoryDoc.collectionImages.set(collection, firstImage.url);
        }
      }

      await categoryDoc.save();
    }

    // Construct product safely
    const product = new Product({
      name,
      category,
      collection,
      price,
      media,
      description,
      colors,
      features,
      inStock,
      featured,
      variants,
    });

    await product.save();

    // Update category product count
    await categoryDoc.updateProductCount();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("🔥 Error creating product:", error.message, error.stack);
    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

// Get all products for admin
const getProducts = async (req, res) => {
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

    // Build filter - default to active products only for admin
    const filter = { isActive: true };
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

    res.status(200).json({
      success: true,
      data: { products, pagination },
      message: 'Products retrieved successfully'
    });
  } catch (error) {
    console.error('Get admin products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving products',
      error: error.message
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const {
      name,
      category,
      collection,
      description,
      price,
      oldPrice,
      media,
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
    if (media) product.media = media;
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

    res.status(200).json({
      success: true,
      data: { product },
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Hard delete - permanently remove from database
    await Product.findByIdAndDelete(req.params.id);

    // Update category product count
    const category = await Category.findOne({ slug: product.category });
    if (category) {
      await category.updateProductCount();
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// Get admin dashboard stats
const getStats = async (req, res) => {
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

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Dashboard stats retrieved successfully'
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard stats',
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getStats
};