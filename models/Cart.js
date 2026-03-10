const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 },
    size: String,
    color: String
  }],
  updatedAt: { type: Date, default: Date.now }
});

mongoose.model('Cart', cartSchema);
