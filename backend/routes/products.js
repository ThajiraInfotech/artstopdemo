const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');
const { validateProduct, validatePagination } = require('../middleware/validation');
const { sendResponse, sendError, getPagination, getPaginationInfo } = require('../utils/helpers');

const router = express.Router();

// @desc    Get all products with filtering, search, and pagination
// @route   GET /api/products
// @access  Public
router.get('/', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      collection,
      search,
      minPrice,
      maxPrice,
      inStock,
      featured,
      sort = 'name',
      order = 'asc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (collection) filter.collection = collection;
    if (inStock === 'true') filter.inStock = true;
    if (featured === 'true') filter.featured = true;

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Search filter
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = {};

    switch (sort) {
      case 'price':
        sortObj.price = sortOrder;
        break;
      case 'rating':
        sortObj.rating = sortOrder;
        break;
      case 'reviews':
        sortObj.reviewCount = sortOrder;
        break;
      case 'newest':
        sortObj.createdAt = -1;
        break;
      case 'oldest':
        sortObj.createdAt = 1;
        break;
      case 'featured':
        sortObj.featured = -1;
        sortObj.name = 1;
        break;
      case 'popular':
        sortObj.views = -1;
        break;
      case 'sales':
        sortObj.sales = -1;
        break;
      default:
        sortObj.name = sortOrder;
    }

    // Add text score for search results
    if (search) {
      sortObj.score = { $meta: 'textScore' };
    }

    // Pagination
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);

    // Get products
    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    // Get total count
    const totalProducts = await Product.countDocuments(filter);

    // Get pagination info
    const pagination = getPaginationInfo(totalProducts, pageNum, limitNum);

    // Get filter stats
    const stats = {
      totalProducts,
      categories: await Product.distinct('category', { isActive: true }),
      collections: await Product.distinct('collection', { isActive: true }),
      priceRange: await Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' }
          }
        }
      ])
    };

    sendResponse(res, 200, {
      products,
      pagination,
      stats: {
        ...stats,
        priceRange: stats.priceRange[0] || { minPrice: 0, maxPrice: 0 }
      },
      filters: {
        category,
        collection,
        search,
        minPrice,
        maxPrice,
        inStock,
        featured,
        sort,
        order
      }
    }, 'Products retrieved successfully');
  } catch (error) {
    console.error('Get products error:', error);
    sendError(res, 500, 'Error retrieving products');
  }
});

// @desc    Get single product by ID or slug
// @route   GET /api/products/:identifier
// @access  Public
router.get('/:identifier', optionalAuth, async (req, res) => {
  try {
    const { identifier } = req.params;

    let product;

    // Check if identifier is MongoDB ObjectId
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(identifier);
    } else {
      // Treat as slug
      product = await Product.findOne({ slug: identifier, isActive: true });
    }

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    // Increment view count
    product.views += 1;
    await product.save();

    // Get related products from same collection
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      collection: product.collection,
      category: product.category,
      isActive: true
    })
      .limit(4)
      .select('name price images rating reviewCount slug featured');

    // Get category info
    const category = await Category.findOne({ slug: product.category });

    sendResponse(res, 200, {
      product,
      relatedProducts,
      category: category ? {
        name: category.name,
        slug: category.slug
      } : null
    }, 'Product retrieved successfully');
  } catch (error) {
    console.error('Get product error:', error);
    sendError(res, 500, 'Error retrieving product');
  }
});

// @desc    Get featured products
// @route   GET /api/products/featured/list
// @access  Public
router.get('/featured/list', async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const products = await Product.find({
      featured: true,
      isActive: true,
      inStock: true
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('name price oldPrice images rating reviewCount slug category collection featured');

    sendResponse(res, 200, { products }, 'Featured products retrieved successfully');
  } catch (error) {
    console.error('Get featured products error:', error);
    sendError(res, 500, 'Error retrieving featured products');
  }
});

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
router.get('/category/:category', validatePagination, async (req, res) => {
  try {
    const { category } = req.params;
    const {
      page = 1,
      limit = 12,
      sort = 'name',
      order = 'asc',
      collection,
      minPrice,
      maxPrice,
      inStock
    } = req.query;

    // Verify category exists
    const categoryDoc = await Category.findOne({ slug: category, isActive: true });
    if (!categoryDoc) {
      return sendError(res, 404, 'Category not found');
    }

    // Build filter
    const filter = {
      category,
      isActive: true
    };

    if (collection) filter.collection = collection;
    if (inStock === 'true') filter.inStock = true;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build sort
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = {};

    switch (sort) {
      case 'price':
        sortObj.price = sortOrder;
        break;
      case 'rating':
        sortObj.rating = sortOrder;
        break;
      case 'newest':
        sortObj.createdAt = -1;
        break;
      case 'featured':
        sortObj.featured = -1;
        sortObj.name = 1;
        break;
      default:
        sortObj.name = sortOrder;
    }

    // Pagination
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);

    // Get products
    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const totalProducts = await Product.countDocuments(filter);
    const pagination = getPaginationInfo(totalProducts, pageNum, limitNum);

    // Get collections in this category
    const collections = await Product.distinct('collection', { category, isActive: true });

    sendResponse(res, 200, {
      products,
      pagination,
      category: categoryDoc,
      collections
    }, 'Category products retrieved successfully');
  } catch (error) {
    console.error('Get category products error:', error);
    sendError(res, 500, 'Error retrieving category products');
  }
});

// @desc    Search products
// @route   GET /api/products/search/:query
// @access  Public
router.get('/search/:query', validatePagination, async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 12 } = req.query;

    if (!query.trim()) {
      return sendError(res, 400, 'Search query is required');
    }

    // Pagination
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);

    // Search products
    const products = await Product.find({
      $text: { $search: query },
      isActive: true
    })
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limitNum);

    const totalProducts = await Product.countDocuments({
      $text: { $search: query },
      isActive: true
    });

    const pagination = getPaginationInfo(totalProducts, pageNum, limitNum);

    sendResponse(res, 200, {
      products,
      pagination,
      query,
      searchStats: {
        totalResults: totalProducts,
        searchTime: Date.now()
      }
    }, 'Search results retrieved successfully');
  } catch (error) {
    console.error('Search products error:', error);
    sendError(res, 500, 'Error searching products');
  }
});

module.exports = router;