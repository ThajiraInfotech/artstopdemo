const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { sendResponse, sendError } = require('../utils/helpers');
const { sendOTP, verifyOTP, resendOTP, getProfile, getAllOTPs, demoAuth } = require('../controllers/authController');

const router = express.Router();

// Helper function to create token response
const createTokenResponse = (user) => {
  const token = jwt.sign(
    {
      userId: user._id || user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const refreshToken = jwt.sign(
    {
      id: user._id || user.id
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  return { token, refreshToken };
};

// Helper function to verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// @desc    Send OTP for login/signup
// @route   POST /api/auth/send-otp
// @access  Public
router.post('/send-otp', sendOTP);

// @desc    Verify OTP and complete authentication
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', verifyOTP);

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
router.post('/resend-otp', resendOTP);

// @desc    Demo authentication for testing
// @route   POST /api/auth/demo
// @access  Public
router.post('/demo', demoAuth);

// @desc    Get all OTPs (debug)
// @route   GET /api/auth/otps
// @access  Public
router.get('/otps', getAllOTPs);

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Compare with environment variables
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      // Create a mock admin user object for token generation
      const mockAdminUser = {
        _id: 'admin-user-id',
        name: 'Admin',
        email: email,
        role: 'admin'
      };

      // Clear any existing refresh tokens for admin
      const adminUser = await User.findOne({ email: email });
      if (adminUser) {
        adminUser.refreshTokens = [];
        await adminUser.save();
      }

      // Generate fresh tokens using the same logic as regular login
      const tokenData = createTokenResponse(mockAdminUser);

      return res.status(200).json({
        success: true,
        data: {
          user: mockAdminUser,
          accessToken: tokenData.token,
          refreshToken: tokenData.refreshToken
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
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
    const user = await User.findById(decoded.userId);
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
router.get('/me', protect, getProfile);

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
      req.user._id,
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
    const user = await User.findById(req.user._id).select('+password');
    
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

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, 'Email is required');
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists or not for security
      return sendResponse(res, 200, null, 'If an account with that email exists, a password reset link has been sent.');
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save();

    // In a real application, you would send an email here
    // For now, we'll just return the token for testing purposes
    console.log(`Password reset token for ${email}: ${resetToken}`);

    sendResponse(res, 200, {
      resetToken: resetToken // Remove this in production
    }, 'If an account with that email exists, a password reset link has been sent.');
  } catch (error) {
    console.error('Forgot password error:', error);
    sendError(res, 500, 'Error processing forgot password request');
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
router.put('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password) {
      return sendError(res, 400, 'Password is required');
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters long');
    }

    // Hash the token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return sendError(res, 400, 'Invalid or expired reset token');
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Clear all refresh tokens for security
    user.refreshTokens = [];

    await user.save();

    sendResponse(res, 200, null, 'Password reset successfully');
  } catch (error) {
    console.error('Reset password error:', error);
    sendError(res, 500, 'Error resetting password');
  }
});

module.exports = router;