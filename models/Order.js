const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerInfo: {
    name: String,
    phone: String,
    address: String
  },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    size: String,
    color: String
  }],
  totalAmount: Number,
  paymentMethod: String,
  orderDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'], 
    default: 'pending' 
  }
});

mongoose.model('Order', orderSchema);
