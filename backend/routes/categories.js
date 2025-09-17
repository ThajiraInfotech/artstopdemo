const express = require('express');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const { validateCategory } = require('../middleware/validation');
const { sendResponse, sendError, generateSlug } = require('../utils/helpers');

const router = express.Router();

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 });

    // Update product counts
    for (let category of categories) {
      await category.updateProductCount();
    }

    sendResponse(res, 200, { categories }, 'Categories retrieved successfully');
  } catch (error) {
    console.error('Get categories error:', error);
    sendError(res, 500, 'Error retrieving categories');
  }
});

// @desc    Get single category by slug
// @route   GET /api/categories/:slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug, 
      isActive: true 
    });

    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    await category.updateProductCount();

    sendResponse(res, 200, { category }, 'Category retrieved successfully');
  } catch (error) {
    console.error('Get category error:', error);
    sendError(res, 500, 'Error retrieving category');
  }
});

// @desc    Get products by category and collection
// @route   GET /api/categories/:category/collections/:collection
// @access  Public
router.get('/:category/collections/:collection', async (req, res) => {
  try {
    const { category, collection } = req.params;
    const { page = 1, limit = 12, sort = 'name', order = 'asc' } = req.query;

    // Verify category exists
    const categoryDoc = await Category.findOne({ 
      slug: category, 
      isActive: true 
    });

    if (!categoryDoc) {
      return sendError(res, 404, 'Category not found');
    }

    // Check if collection exists in category
    if (!categoryDoc.collections.includes(collection)) {
      return sendError(res, 404, 'Collection not found in this category');
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
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get products
    const products = await Product.find({
      category,
      collection,
      isActive: true
    })
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const totalProducts = await Product.countDocuments({
      category,
      collection,
      isActive: true
    });

    // Get collection image
    const collectionImage = categoryDoc.collectionImages.get(collection);

    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
      totalProducts,
      hasNext: pageNum < Math.ceil(totalProducts / limitNum),
      hasPrev: pageNum > 1
    };

    sendResponse(res, 200, {
      products,
      pagination,
      collection: {
        name: collection,
        image: collectionImage,
        category: categoryDoc.name
      }
    }, 'Collection products retrieved successfully');
  } catch (error) {
    console.error('Get collection products error:', error);
    sendError(res, 500, 'Error retrieving collection products');
  }
});

// @desc    Create category (Admin only)
// @route   POST /api/categories
// @access  Private/Admin
router.post('/', protect, adminOnly, validateCategory, async (req, res) => {
  try {
    const { name, slug, image, description, collections = [] } = req.body;

    // Check if category with this slug already exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return sendError(res, 400, 'Category with this slug already exists');
    }

    const category = await Category.create({
      name: name.trim(),
      slug: slug.toLowerCase().trim(),
      image,
      description: description ? description.trim() : '',
      collections,
      collectionImages: new Map()
    });

    sendResponse(res, 201, { category }, 'Category created successfully');
  } catch (error) {
    console.error('Create category error:', error);
    sendError(res, 500, 'Error creating category');
  }
});

// @desc    Update category (Admin only)
// @route   PUT /api/categories/:id
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, slug, image, description, collections, collectionImages } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    // Check if slug is being changed and if it already exists
    if (slug && slug !== category.slug) {
      const existingCategory = await Category.findOne({ 
        slug: slug.toLowerCase().trim(),
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return sendError(res, 400, 'Category with this slug already exists');
      }
    }

    // Update fields
    if (name) category.name = name.trim();
    if (slug) category.slug = slug.toLowerCase().trim();
    if (image) category.image = image;
    if (description !== undefined) category.description = description.trim();
    if (collections) category.collections = collections;
    if (collectionImages) {
      category.collectionImages = new Map(Object.entries(collectionImages));
    }

    await category.save();
    await category.updateProductCount();

    sendResponse(res, 200, { category }, 'Category updated successfully');
  } catch (error) {
    console.error('Update category error:', error);
    sendError(res, 500, 'Error updating category');
  }
});

// @desc    Delete category (Admin only)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ 
      category: category.slug,
      isActive: true 
    });
    
    if (productCount > 0) {
      return sendError(res, 400, 'Cannot delete category with active products');
    }

    await Category.findByIdAndDelete(req.params.id);

    sendResponse(res, 200, null, 'Category deleted successfully');
  } catch (error) {
    console.error('Delete category error:', error);
    sendError(res, 500, 'Error deleting category');
  }
});

module.exports = router;