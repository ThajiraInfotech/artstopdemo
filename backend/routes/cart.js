const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { validateCartItem } = require('../middleware/validation');
const { sendResponse, sendError } = require('../utils/helpers');

const router = express.Router();

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name images price inStock');

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: []
      });
    }

    // Filter out items with deleted/inactive products
    cart.items = cart.items.filter(item => 
      item.product && item.product.inStock
    );

    // Recalculate totals
    await cart.save();

    sendResponse(res, 200, { cart }, 'Cart retrieved successfully');
  } catch (error) {
    console.error('Get cart error:', error);
    sendError(res, 500, 'Error retrieving cart');
  }
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
router.post('/', protect, validateCartItem, async (req, res) => {
  try {
    const { productId, quantity = 1, variant, color } = req.body;

    // Check if product exists and is available
    const product = await Product.findById(productId);
    if (!product || !product.isActive || !product.inStock) {
      return sendError(res, 404, 'Product not available');
    }

    // Determine price based on variant or base price
    let price = product.price;
    let variantInfo = null;

    if (variant && product.variants.length > 0) {
      const selectedVariant = product.variants.find(v => v.value === variant);
      if (!selectedVariant) {
        return sendError(res, 400, 'Invalid variant selected');
      }
      price = selectedVariant.price;
      variantInfo = {
        name: selectedVariant.name,
        value: selectedVariant.value,
        price: selectedVariant.price,
        dimensions: selectedVariant.dimensions
      };
    }

    // Validate color if provided
    if (color && product.colors.length > 0 && !product.colors.includes(color)) {
      return sendError(res, 400, 'Invalid color selected');
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: []
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item =>
      item.product.toString() === productId &&
      item.variant?.value === variant &&
      item.color === color
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].total = 
        cart.items[existingItemIndex].quantity * price;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        variant: variantInfo,
        color,
        price,
        total: quantity * price
      });
    }

    await cart.save();

    // Populate and return updated cart
    cart = await Cart.findById(cart._id)
      .populate('items.product', 'name images price inStock');

    sendResponse(res, 200, { cart }, 'Item added to cart successfully');
  } catch (error) {
    console.error('Add to cart error:', error);
    sendError(res, 500, 'Error adding item to cart');
  }
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
router.put('/:itemId', protect, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return sendError(res, 400, 'Quantity must be at least 1');
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return sendError(res, 404, 'Cart not found');
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return sendError(res, 404, 'Item not found in cart');
    }

    // Update quantity and total
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].total = quantity * cart.items[itemIndex].price;

    await cart.save();

    // Populate and return updated cart
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name images price inStock');

    sendResponse(res, 200, { cart: updatedCart }, 'Cart item updated successfully');
  } catch (error) {
    console.error('Update cart item error:', error);
    sendError(res, 500, 'Error updating cart item');
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
router.delete('/:itemId', protect, async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return sendError(res, 404, 'Cart not found');
    }

    // Remove item
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);

    await cart.save();

    // Populate and return updated cart
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name images price inStock');

    sendResponse(res, 200, { cart: updatedCart }, 'Item removed from cart successfully');
  } catch (error) {
    console.error('Remove cart item error:', error);
    sendError(res, 500, 'Error removing item from cart');
  }
});

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    sendResponse(res, 200, { cart }, 'Cart cleared successfully');
  } catch (error) {
    console.error('Clear cart error:', error);
    sendError(res, 500, 'Error clearing cart');
  }
});

// @desc    Get cart count
// @route   GET /api/cart/count
// @access  Private
router.get('/count', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    const count = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;

    sendResponse(res, 200, { count }, 'Cart count retrieved successfully');
  } catch (error) {
    console.error('Get cart count error:', error);
    sendError(res, 500, 'Error retrieving cart count');
  }
});

module.exports = router;