const mongoose = require('mongoose');
const User = require('../models/User');
const OTP = require('../models/OTP');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
require('dotenv').config();

const clearDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/artstop');
    console.log('Connected to database');

    // Clear all collections
    console.log('Clearing database...');

    await Promise.all([
      User.deleteMany({}),
      OTP.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Order.deleteMany({})
    ]);

    console.log('✅ Database cleared successfully!');
    console.log('All users, OTPs, products, categories, and orders have been deleted.');

  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  clearDatabase();
}

module.exports = clearDatabase;