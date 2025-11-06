const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const deleteAllProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Delete all products
    const result = await Product.deleteMany({});
    console.log(`Deleted ${result.deletedCount} products`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error deleting products:', error);
    process.exit(1);
  }
};

deleteAllProducts();