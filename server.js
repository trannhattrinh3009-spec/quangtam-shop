const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());

// Phục vụ các file tĩnh
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

mongoose.connect('mongodb://localhost:27017/quangtamshop')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Tải tất cả các model
try {
  require('./models/User');
  require('./models/Product');
  require('./models/Category');
  require('./models/Collection');
  require('./models/Deal');
  require('./models/Blog');
  require('./models/Banner');
  require('./models/Cart');
  require('./models/Order');
} catch (e) {
  console.warn("Cảnh báo: Không thể tải một hoặc nhiều models. Đảm bảo file model tồn tại.");
}

const User = mongoose.model('User');
const Product = mongoose.model('Product');
const Category = mongoose.model('Category');
const Collection = mongoose.model('Collection');
const Deal = mongoose.model('Deal');
const Blog = mongoose.model('Blog');
const Banner = mongoose.model('Banner');
const Cart = mongoose.model('Cart');
const Order = mongoose.model('Order');

const JWT_SECRET = 'quangtam_jwt_secret_2025';

// Middleware xác thực token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Không có token xác thực' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    req.user = user; // user chứa { id, isAdmin }
    next();
  });
};

// Middleware kiểm tra quyền admin
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Yêu cầu quyền admin' });
  }
  next();
};

// ===================================
// API CHO TRANG CỬA HÀNG (PUBLIC)
// ===================================
// ... (Các API public giữ nguyên như file gốc của bạn)
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin.' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email này đã được sử dụng' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ fullName, email, password: hashedPassword });
    await user.save();
    const { password: _, ...safeUser } = user.toObject();
    res.status(201).json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký' });
  }
});
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }
    const { password: _, ...safeUser } = user.toObject();
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập' });
  }
});
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().populate('category').sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy sản phẩm' });
  }
});
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh mục' });
  }
});
app.get('/api/collections', async (req, res) => {
  try {
    const collections = await Collection.find().populate('products');
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy bộ sưu tập' });
  }
});
app.get('/api/deals', async (req, res) => {
  try {
    const deals = await Deal.find();
    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy khuyến mãi' });
  }
});
app.get('/api/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ date: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy bài viết blog' });
  }
});
app.get('/api/banners', async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy banner' });
  }
});
app.get('/api/cart/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId }).populate('items.product');
    res.json(cart || { items: [] });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy giỏ hàng' });
  }
});
app.post('/api/cart', async (req, res) => {
  try {
    const { userId, productId, quantity = 1, size, color } = req.body;
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    const itemIndex = cart.items.findIndex(i =>
      i.product.toString() === productId &&
      i.size === size &&
      i.color === color
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
      if (cart.items[itemIndex].quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      }
    } else if (quantity > 0) {
      cart.items.push({ product: productId, quantity, size, color });
    }

    cart.updatedAt = Date.now();
    await cart.save();
    const populated = await cart.populate('items.product');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xử lý giỏ hàng' });
  }
});
app.post('/api/orders', async (req, res) => {
  try {
    const { user, items, customerInfo, totalAmount, paymentMethod } = req.body;
    if (!user || !items || items.length === 0 || !totalAmount) {
      return res.status(400).json({ message: 'Thiếu thông tin đơn hàng' });
    }

    const lastOrder = await Order.findOne().sort({ orderDate: -1 });
    const newOrderIdNum = lastOrder ? parseInt(lastOrder.orderId.replace('QT', '')) + 1 : 1;
    const orderId = `QT${String(newOrderIdNum).padStart(4, '0')}`;

    const order = new Order({ orderId, user, items, customerInfo, totalAmount, paymentMethod });
    await order.save();
    await Cart.deleteOne({ user: user });

    res.status(201).json({ success: true, orderId: order.orderId });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo đơn hàng' });
  }
});

// ===================================
// API CHO TRANG QUẢN TRỊ (ADMIN)
// ===================================

app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email không tồn tại' });
    }
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Tài khoản không có quyền admin' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mật khẩu không chính xác' });
    }

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { fullName: user.fullName, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi đăng nhập admin' });
  }
});

// Middleware cho tất cả các route /api/admin/*
app.use('/api/admin/*', authenticateToken, isAdmin);

// --- Products ---
app.get('/api/admin/products', async (req, res) => {
  try {
    const products = await Product.find().populate('category').sort({ _id: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post('/api/admin/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    const populatedProduct = await Product.findById(product._id).populate('category');
    res.status(201).json(populatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('category');
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Orders ---
app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'fullName email').sort({ orderDate: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.put('/api/admin/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- Users/Customers ---
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Categories (ĐÃ BỔ SUNG API CRUD) ---
app.get('/api/admin/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post('/api/admin/categories', async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.put('/api/admin/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.delete('/api/admin/categories/:id', async (req, res) => {
  try {
    // Kiểm tra xem có sản phẩm nào thuộc danh mục này không
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({ message: `Không thể xóa danh mục vì đang có ${productCount} sản phẩm thuộc danh mục này.` });
    }
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// --- Statistics ---
app.get('/api/admin/stats/all', async (req, res) => {
  try {
    const totalRevenueResult = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ isAdmin: false });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayOrders = await Order.countDocuments({ orderDate: { $gte: today, $lt: tomorrow } });

    res.json({
      revenue: totalRevenueResult[0]?.total || 0,
      orders: totalOrders,
      products: totalProducts,
      customers: totalCustomers,
      pendingOrders: pendingOrders,
      todayOrders: todayOrders
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================================
// ROUTING CHO GIAO DIỆN
// ===================================
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});