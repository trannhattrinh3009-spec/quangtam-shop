const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: Number,
  image: { type: String, required: true },
  discount: Number,
  endDate: Date,
  stock: Number,
  isHot: Boolean
});

mongoose.model('Deal', dealSchema);
