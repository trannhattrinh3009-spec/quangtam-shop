const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  address: String,
  isAdmin: { type: Boolean, default: false }, // <<< THÊM DÒNG NÀY
  createdAt: { type: Date, default: Date.now }
});

mongoose.model('User', userSchema);
