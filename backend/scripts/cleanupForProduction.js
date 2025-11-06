const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const OTP = require('../models/OTP');
require('dotenv').config();

const cleanupForProduction = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/artstop');
    console.log('Connected to database');

    console.log('🧹 Starting production cleanup...');

    // 1. Delete all products (but keep categories and collections)
    console.log('Deleting all products...');
    const productsDeleted = await Product.deleteMany({});
    console.log(`✅ Deleted ${productsDeleted.deletedCount} products`);

    // 2. Delete all demo users and customers (but keep admin users)
    console.log('Deleting demo users and customers...');
    const usersDeleted = await User.deleteMany({
      role: { $ne: 'admin' } // Keep admin users
    });
    console.log(`✅ Deleted ${usersDeleted.deletedCount} demo users/customers`);

    // 3. Delete all demo orders
    console.log('Deleting all orders...');
    const ordersDeleted = await Order.deleteMany({});
    console.log(`✅ Deleted ${ordersDeleted.deletedCount} orders`);

    // 4. Clean up OTP records
    console.log('Cleaning up OTP records...');
    const otpDeleted = await OTP.deleteMany({});
    console.log(`✅ Deleted ${otpDeleted.deletedCount} OTP records`);

    // 5. Reset category product counts to 0
    console.log('Resetting category product counts...');
    await Category.updateMany({}, { productCount: 0 });
    console.log('✅ Reset category product counts to 0');

    console.log('\n🎉 Production cleanup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Products deleted: ${productsDeleted.deletedCount}`);
    console.log(`- Demo users/customers deleted: ${usersDeleted.deletedCount}`);
    console.log(`- Orders deleted: ${ordersDeleted.deletedCount}`);
    console.log(`- OTP records deleted: ${otpDeleted.deletedCount}`);
    console.log('- Categories and collections preserved');
    console.log('- Admin users preserved');
    console.log('\n✨ Your site is now ready for production!');
    console.log('📝 Note: Only products ordered by users with actual payments will exist in the future');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  cleanupForProduction();
}

module.exports = cleanupForProduction;