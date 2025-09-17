const express = require('express');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { createTokenResponse, verifyRefreshToken } = require('../utils/jwt');
const { sendResponse, sendError } = require('../utils/helpers');

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 400, 'User already exists with this email');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || ''
    });

    // Generate tokens
    const tokenData = createTokenResponse(user);

    // Save refresh token
    user.refreshTokens.push({
      token: tokenData.refreshToken
    });
    await user.save();

    sendResponse(res, 201, tokenData, 'User registered successfully');
  } catch (error) {
    console.error('Registration error:', error);
    sendError(res, 500, 'Error registering user');
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and get password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 401, 'Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      return sendError(res, 401, 'Account is deactivated');
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return sendError(res, 401, 'Invalid credentials');
    }

    // Generate tokens
    const tokenData = createTokenResponse(user);

    // Save refresh token
    user.refreshTokens.push({
      token: tokenData.refreshToken
    });
    await user.save();

    sendResponse(res, 200, tokenData, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 500, 'Error logging in');
  }
});

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public
router.post('/admin/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and is admin
    const user = await User.findOne({ email, role: 'admin' }).select('+password');
    if (!user) {
      return sendError(res, 401, 'Invalid admin credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      return sendError(res, 401, 'Account is deactivated');
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return sendError(res, 401, 'Invalid admin credentials');
    }

    // Generate tokens
    const tokenData = createTokenResponse(user);

    // Save refresh token
    user.refreshTokens.push({
      token: tokenData.refreshToken
    });
    await user.save();

    sendResponse(res, 200, tokenData, 'Admin login successful');
  } catch (error) {
    console.error('Admin login error:', error);
    sendError(res, 500, 'Error logging in');
  }
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 401, 'Refresh token is required');
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Check if user exists and token is valid
    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, 401, 'Invalid refresh token');
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(
      tokenObj => tokenObj.token === refreshToken
    );
    
    if (!tokenExists) {
      return sendError(res, 401, 'Invalid refresh token');
    }

    // Generate new tokens
    const tokenData = createTokenResponse(user);

    // Remove old refresh token and add new one
    user.refreshTokens = user.refreshTokens.filter(
      tokenObj => tokenObj.token !== refreshToken
    );
    user.refreshTokens.push({
      token: tokenData.refreshToken
    });
    await user.save();

    sendResponse(res, 200, tokenData, 'Token refreshed successfully');
  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Invalid or expired refresh token');
    }
    
    sendError(res, 500, 'Error refreshing token');
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove specific refresh token
      req.user.refreshTokens = req.user.refreshTokens.filter(
        tokenObj => tokenObj.token !== refreshToken
      );
    } else {
      // Remove all refresh tokens (logout from all devices)
      req.user.refreshTokens = [];
    }

    await req.user.save();

    sendResponse(res, 200, null, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    sendError(res, 500, 'Error logging out');
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    sendResponse(res, 200, { user }, 'User profile retrieved successfully');
  } catch (error) {
    console.error('Get profile error:', error);
    sendError(res, 500, 'Error retrieving user profile');
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (address) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    sendResponse(res, 200, { user }, 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    sendError(res, 500, 'Error updating profile');
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 400, 'Current password and new password are required');
    }

    if (newPassword.length < 6) {
      return sendError(res, 400, 'New password must be at least 6 characters long');
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      return sendError(res, 401, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    user.refreshTokens = []; // Clear all refresh tokens
    await user.save();

    sendResponse(res, 200, null, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    sendError(res, 500, 'Error changing password');
  }
});

module.exports = router;