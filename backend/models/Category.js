const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: [true, 'Category slug is required'],
    unique: true,
    lowercase: true
  },
  image: {
    type: String,
    required: [true, 'Category image is required']
  },
  description: {
    type: String,
    trim: true
  },
  collections: [{
    type: String,
    trim: true
  }],
  collectionImages: {
    type: Map,
    of: String,
    default: {}
  },
  productCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update product count when products are added/removed
categorySchema.methods.updateProductCount = async function() {
  const Product = mongoose.model('Product');
  this.productCount = await Product.countDocuments({ 
    category: this.slug,
    isActive: true 
  });
  return this.save();
};

module.exports = mongoose.model('Category', categorySchema);