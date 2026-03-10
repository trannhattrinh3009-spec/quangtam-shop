const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: Number,
  image: { type: String, required: true },
  description: { type: String, required: true },
  material: String,
  brand: String,
  sizes: [String],
  colors: [String],
  stock: { type: Number, default: 0 },
  isNew: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  tags: [String]
});

mongoose.model('Product', productSchema);
