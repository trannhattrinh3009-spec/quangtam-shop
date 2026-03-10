const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  icon: String,
  description: String,
  image: String
});

mongoose.model('Category', categorySchema);
