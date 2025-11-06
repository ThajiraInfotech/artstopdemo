const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['login', 'signup'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index - automatically delete expired documents
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3 // Maximum verification attempts
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient lookup
otpSchema.index({ email: 1, purpose: 1 });

// Method to check if OTP is expired
otpSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to check if max attempts reached
otpSchema.methods.maxAttemptsReached = function() {
  return this.attempts >= 3;
};

// Static method to generate OTP
otpSchema.statics.generateOTP = function() {
  // Generate 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = mongoose.model('OTP', otpSchema);