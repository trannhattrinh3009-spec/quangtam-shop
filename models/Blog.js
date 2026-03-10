const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  excerpt: String,
  image: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, default: 'Lê Quang Tâm' },
  date: { type: Date, default: Date.now },
  readTime: String,
  tags: [String]
});

mongoose.model('Blog', blogSchema);
