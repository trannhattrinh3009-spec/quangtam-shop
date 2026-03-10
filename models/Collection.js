const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: String,
  image: String,
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  priceRange: String,
  isActive: { type: Boolean, default: true }
});

mongoose.model('Collection', collectionSchema);
