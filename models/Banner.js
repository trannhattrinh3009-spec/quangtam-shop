const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  image: String,
  link: String,
  type: { type: String, enum: ['hero', 'sidebar'], default: 'hero' },
  isActive: { type: Boolean, default: true }
});

mongoose.model('Banner', bannerSchema);
