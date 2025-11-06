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
    // Handle both ObjectId and string user IDs (for admin/demo users)
    const userId = req.user._id || req.user.userId;
    let cart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name media price inStock');

    if (!cart) {
      cart = await Cart.create({
        user: userId,
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
    console.log('POST /api/cart - Request body:', req.body);
    console.log('POST /api/cart - User:', req.user ? { _id: req.user._id, userId: req.user.userId, email: req.user.email } : 'No user');
    const { productId, quantity = 1, variant, color } = req.body;

    // Check if product exists and is available
    console.log('POST /api/cart - Finding product with ID:', productId);
    const product = await Product.findById(productId);
    console.log('POST /api/cart - Product found:', product ? { _id: product._id, name: product.name, isActive: product.isActive, inStock: product.inStock } : 'Product not found');
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
    const userId = req.user._id || req.user.userId;
    console.log('POST /api/cart - User ID for cart:', userId);
    let cart = await Cart.findOne({ user: userId });
    console.log('POST /api/cart - Existing cart found:', cart ? cart._id : 'No existing cart, creating new one');
    if (!cart) {
      cart = new Cart({
        user: userId,
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
        name: product.name,
        quantity,
        variant: variantInfo,
        color,
        price,
        total: quantity * price,
        image: product.media && product.media.length > 0 ? (typeof product.media[0] === 'string' ? product.media[0] : product.media[0].url) : ''
      });
    }

    console.log('POST /api/cart - Saving cart with items:', cart.items.length);
    await cart.save();
    console.log('POST /api/cart - Cart saved successfully, cart ID:', cart._id);

    // Populate and return updated cart
    console.log('POST /api/cart - Populating cart data');
    cart = await Cart.findById(cart._id)
      .populate('items.product', 'name media price inStock');
    console.log('POST /api/cart - Cart populated successfully');

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

    const userId = req.user._id || req.user.userId;
    const cart = await Cart.findOne({ user: userId });
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
      .populate('items.product', 'name media price inStock');

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

    const userId = req.user._id || req.user.userId;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return sendError(res, 404, 'Cart not found');
    }

    // Remove item
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);

    await cart.save();

    // Populate and return updated cart
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name media price inStock');

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
    const userId = req.user._id || req.user.userId;
    let cart = await Cart.findOne({ user: userId });

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
    console.log('GET /api/cart/count - User:', req.user ? { _id: req.user._id, userId: req.user.userId } : 'No user');
    const userId = req.user._id || req.user.userId;
    console.log('GET /api/cart/count - Finding cart for user ID:', userId);
    const cart = await Cart.findOne({ user: userId });
    console.log('GET /api/cart/count - Cart found:', cart ? { _id: cart._id, itemsCount: cart.items.length } : 'No cart');
    const count = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
    console.log('GET /api/cart/count - Total count:', count);

    sendResponse(res, 200, { count }, 'Cart count retrieved successfully');
  } catch (error) {
    console.error('Get cart count error:', error);
    sendError(res, 500, 'Error retrieving cart count');
  }
});

module.exports = router;