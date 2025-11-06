const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/emailService');
const { sendResponse, sendError } = require('../utils/helpers');

// Send OTP for login/signup
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return sendError(res, 400, 'Valid email is required');
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await User.findOne({ email: emailLower });

    let purpose;
    if (existingUser) {
      purpose = 'login';
    } else {
      purpose = 'signup';
    }

    // Generate OTP
    const otp = OTP.generateOTP();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Delete any existing OTP for this email and purpose
    await OTP.deleteMany({ email: emailLower, purpose });

    // Create new OTP record
    const otpRecord = new OTP({
      email: emailLower,
      otp,
      purpose,
      expiresAt
    });

    await otpRecord.save();
    console.log("OTP saved:", { email: emailLower, otp, purpose, expiresAt });

    // Send OTP email
    await sendOTPEmail(emailLower, otp, purpose);

    const responseData = {
      purpose,
      message: `OTP sent to ${emailLower}`,
      expiresIn: '10 minutes'
    };

    // Include OTP in development for testing
    if (process.env.NODE_ENV !== 'production') {
      responseData.otp = otp;
    }

    sendResponse(res, 200, responseData, 'OTP sent successfully');

  } catch (error) {
    console.error('Send OTP error:', error);
    sendError(res, 500, 'Failed to send OTP');
  }
};

// Verify OTP and complete authentication
const verifyOTP = async (req, res) => {
  try {
    const { email, otp, name } = req.body;

    console.log("Verify OTP Request:", { email, otp, name, hasName: !!name });

    if (!email || !otp) {
      return sendError(res, 400, 'Email and OTP are required');
    }

    const emailLower = email.toLowerCase().trim();

    console.log("Searching for OTP with:", { email: emailLower, otp, isVerified: false });

    // Find all OTP records for debugging
    const allOtps = await OTP.find({ email: emailLower });
    console.log("All OTPs for email:", allOtps.map(o => ({ otp: o.otp, purpose: o.purpose, isVerified: o.isVerified, expiresAt: o.expiresAt, isExpired: o.isExpired() })));

    // Find OTP record
    const otpRecord = await OTP.findOne({
      email: emailLower,
      otp,
      isVerified: false
    });

    console.log("OTP Record found:", otpRecord ? { id: otpRecord._id, purpose: otpRecord.purpose, expiresAt: otpRecord.expiresAt, isExpired: otpRecord.isExpired() } : null);

    if (!otpRecord) {
      return sendError(res, 400, 'Invalid or expired OTP');
    }

    // Check if expired
    if (otpRecord.isExpired()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return sendError(res, 400, 'OTP has expired');
    }

    // Check max attempts
    if (otpRecord.maxAttemptsReached()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return sendError(res, 400, 'Maximum verification attempts exceeded');
    }

    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    let user;
    let isNewUser = false;

    console.log("OTP Record:", { purpose: otpRecord.purpose, email: otpRecord.email });

    if (otpRecord.purpose === 'login') {
      // Existing user login
      user = await User.findOne({ email: emailLower });
      if (!user) {
        return sendError(res, 400, 'User not found');
      }
    } else if (otpRecord.purpose === 'signup') {
      // New user signup
      if (!name || name.trim().length < 2) {
        return sendError(res, 400, 'Name is required for signup (minimum 2 characters)');
      }

      // Check if user already exists (double check)
      const existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        return sendError(res, 400, 'User already exists. Please use login instead.');
      }

      // Create new user
      user = new User({
        name: name.trim(),
        email: emailLower,
        role: 'user'
      });

      await user.save();
      isNewUser = true;
    }

    // Mark OTP as verified and delete it
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate JWT tokens
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      {
        userId: user._id
      },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '30d' }
    );

    // Store refresh token in user document
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    sendResponse(res, 200, {
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=faces&fit=crop&w=100&h=100'
      },
      isNewUser
    }, isNewUser ? 'Account created successfully' : 'Login successful');

  } catch (error) {
    console.error('Verify OTP error:', error);
    sendError(res, 500, 'Failed to verify OTP');
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, 'Email is required');
    }

    const emailLower = email.toLowerCase().trim();

    // Find existing OTP record
    const existingOTP = await OTP.findOne({
      email: emailLower,
      isVerified: false
    }).sort({ createdAt: -1 });

    if (!existingOTP) {
      return sendError(res, 400, 'No active OTP found. Please request a new one.');
    }

    // Check if too many requests (rate limiting)
    const timeSinceLastRequest = Date.now() - existingOTP.createdAt.getTime();
    if (timeSinceLastRequest < 60000) { // 1 minute cooldown
      return sendError(res, 429, 'Please wait before requesting another OTP');
    }

    // Generate new OTP
    const otp = OTP.generateOTP();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Update existing OTP
    existingOTP.otp = otp;
    existingOTP.expiresAt = expiresAt;
    existingOTP.attempts = 0; // Reset attempts
    await existingOTP.save();

    // Send OTP email
    await sendOTPEmail(emailLower, otp, existingOTP.purpose);

    sendResponse(res, 200, {
      purpose: existingOTP.purpose,
      message: `OTP resent to ${emailLower}`,
      expiresIn: '10 minutes'
    }, 'OTP resent successfully');

  } catch (error) {
    console.error('Resend OTP error:', error);
    sendError(res, 500, 'Failed to resend OTP');
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    sendResponse(res, 200, { user }, 'Profile retrieved successfully');
  } catch (error) {
    console.error('Get profile error:', error);
    sendError(res, 500, 'Failed to get profile');
  }
};

// Demo authentication for testing (remove in production)
const demoAuth = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return sendError(res, 400, 'Email is required');
    }

    const emailLower = email.toLowerCase().trim();
    const userName = name || 'Demo User';

    // Check if user exists
    let user = await User.findOne({ email: emailLower });

    if (!user) {
      // Create demo user
      user = new User({
        name: userName,
        email: emailLower,
        role: 'user'
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    sendResponse(res, 200, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=faces&fit=crop&w=100&h=100'
      }
    }, 'Demo authentication successful');
  } catch (error) {
    console.error('Demo auth error:', error);
    sendError(res, 500, 'Failed to authenticate demo user');
  }
};

// Debug: Get all OTPs (remove in production)
const getAllOTPs = async (req, res) => {
  try {
    const otps = await OTP.find({});
    sendResponse(res, 200, { otps }, 'OTPs retrieved');
  } catch (error) {
    console.error('Get OTPs error:', error);
    sendError(res, 500, 'Failed to get OTPs');
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP,
  getProfile,
  getAllOTPs,
  demoAuth
};