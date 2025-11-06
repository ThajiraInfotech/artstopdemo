const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  variant: {
    name: String,
    value: String,
    price: Number,
    dimensions: String
  },
  color: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    trim: true
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate totals before saving
cartSchema.pre('save', function(next) {
// Calculate subtotal
this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);

// Calculate tax (18% GST)
this.tax = Math.round(this.subtotal * 0.18);

// Calculate shipping (free shipping over ₹5000)
this.shipping = this.subtotal >= 5000 ? 0 : 200;

// Calculate total
this.total = this.subtotal + this.tax + this.shipping;

this.lastUpdated = new Date();
next();
});

module.exports = mongoose.model('Cart', cartSchema);