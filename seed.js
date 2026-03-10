const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import all models
require('./models/User');
require('./models/Category');
require('./models/Product');
require('./models/Collection');
require('./models/Deal');
require('./models/Blog');
require('./models/Banner');

const User = mongoose.model('User');
const Category = mongoose.model('Category');
const Product = mongoose.model('Product');
const Collection = mongoose.model('Collection');
const Deal = mongoose.model('Deal');
const Blog = mongoose.model('Blog');
const Banner = mongoose.model('Banner');

const DB_URI = 'mongodb://localhost:27017/quangtamshop';

async function seedData() {
    try {
        await mongoose.connect(DB_URI);
        console.log('--- ĐANG KẾT NỐI MONGODB ---');

        // Xóa dữ liệu cũ
        await Promise.all([
            User.deleteMany({}),
            Category.deleteMany({}),
            Product.deleteMany({}),
            Collection.deleteMany({}),
            Deal.deleteMany({}),
            Blog.deleteMany({}),
            Banner.deleteMany({})
        ]);
        console.log('1. Đã xóa sạch dữ liệu cũ.');

        // 2. TẠO ADMIN
        const hashedAdminPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            fullName: '(Admin)',
            email: 'admin@gmail.com',
            password: hashedAdminPassword,
            isAdmin: true,
            phone: '0877706152',
            address: 'TP. Hồ Chí Minh'
        });
        console.log('2. Đã tạo Admin: admin@gmail.com / admin123');

        // 3. TẠO DANH MỤC
        const categories = await Category.insertMany([
            { name: 'Áo Bóng Đá', slug: 'ao-bong-da', icon: 'fas fa-tshirt', description: 'Áo đấu câu lạc bộ và đội tuyển quốc gia.' },
            { name: 'Giày Thể Thao', slug: 'giay-the-thao', icon: 'fas fa-running', description: 'Giày đá bóng, giày chạy bộ chuyên dụng.' },
            { name: 'Phụ Kiện', slug: 'phu-kien', icon: 'fas fa-mitten', description: 'Tất, găng tay, băng quấn và dụng cụ hỗ trợ.' },
            { name: 'Đồ Tập Gym', slug: 'do-tap-gym', icon: 'fas fa-dumbbell', description: 'Trang phục tập luyện thoáng mát, co giãn.' }
        ]);
        console.log('3. Đã tạo 4 danh mục.');

        const catAo = categories[0]._id;
        const catGiay = categories[1]._id;
        const catPhuKien = categories[2]._id;
        const catGym = categories[3]._id;

        // 4. TẠO SẢN PHẨM
        const productsData = [
            {
                name: 'Áo Đấu CLB Real Madrid 2024/25',
                price: 220000,
                originalPrice: 280000,
                image: 'https://lh3.googleusercontent.com/d/1B-q7pU6zG9Yn0P1IqL_Wn9u5D7XJ4mRk',
                description: 'Áo đấu sân nhà Real Madrid mùa giải mới nhất, chất liệu thun lạnh cao cấp.',
                sizes: ['S', 'M', 'L', 'XL'],
                colors: ['Trắng'],
                category: catAo,
                isBestSeller: true
            },
            {
                name: 'Áo Đấu Đội Tuyển Việt Nam',
                price: 195000,
                originalPrice: 250000,
                image: 'https://lh3.googleusercontent.com/d/1V-tXpL8zH9Fk_M9Q7m8u5D6XJ4kR9P5m',
                description: 'Áo đấu Đội tuyển Quốc gia Việt Nam, màu đỏ truyền thống hào khí dân tộc.',
                sizes: ['S', 'M', 'L', 'XL'],
                colors: ['Đỏ'],
                category: catAo,
                isNew: true
            },
            {
                name: 'Giày Đá Bóng Nike Mercurial Vapor 15',
                price: 1550000,
                originalPrice: 1850000,
                image: 'https://lh3.googleusercontent.com/d/1G-yXpL8zH9Fk_M9Q7m8u5D6XJ4kR9P5m',
                description: 'Giày đá bóng chuyên dụng cho cỏ nhân tạo, độ bám sân cực tốt.',
                sizes: ['39', '40', '41', '42'],
                colors: ['Xanh Chuối', 'Hồng'],
                category: catGiay,
                isBestSeller: true
            },
            {
                name: 'Giày Chạy Bộ Adidas Ultraboost',
                price: 2450000,
                originalPrice: 3200000,
                image: 'https://lh3.googleusercontent.com/d/1A-dXpL8zH9Fk_M9Q7m8u5D6XJ4kR9P5m',
                description: 'Trải nghiệm chạy bộ êm ái nhất với công nghệ đệm Boost huyền thoại.',
                sizes: ['40', '41', '42', '43'],
                colors: ['Đen', 'Xám'],
                category: catGiay
            },
            {
                name: 'Găng Tay Thủ Môn Adidas Predator',
                price: 450000,
                originalPrice: 550000,
                image: 'https://lh3.googleusercontent.com/d/1S-gXpL8zH9Fk_M9Q7m8u5D6XJ4kR9P5m',
                description: 'Độ bám dính cực cao, bảo vệ ngón tay tốt cho các thủ môn.',
                category: catPhuKien
            },
            {
                name: 'Tất Thể Thao Chống Trượt',
                price: 45000,
                originalPrice: 65000,
                image: 'https://lh3.googleusercontent.com/d/1T-tXpL8zH9Fk_M9Q7m8u5D6XJ4kR9P5m',
                description: 'Giúp bàn chân cố định trong giày, tránh phồng rộp khi vận động mạnh.',
                category: catPhuKien
            }
        ];
        const products = await Product.insertMany(productsData);
        console.log('4. Đã tạo 6 sản phẩm.');

        // 5. TẠO BỘ SƯU TẬP (COLLECTIONS)
        await Collection.insertMany([
            {
                name: 'Summer Sport 2025',
                slug: 'summer-sport-2025',
                description: 'Bộ sưu tập trang phục thể thao thoáng mát cho mùa hè năng động.',
                image: 'https://lh3.googleusercontent.com/d/1C-lXpL8zH9Fk_M9Q7m8u5D6XJ4kR9P5m',
                products: [products[0]._id, products[1]._id],
                priceRange: '195k - 250k'
            },
            {
                name: 'Elite Footwear',
                slug: 'elite-footwear',
                description: 'Dòng giày cao cấp cho vận động viên chuyên nghiệp.',
                image: 'https://lh3.googleusercontent.com/d/1F-wXpL8zH9Fk_M9Q7m8u5D6XJ4kR9P5m',
                products: [products[2]._id, products[3]._id],
                priceRange: '1.5tr - 3tr'
            }
        ]);
        console.log('5. Đã tạo 2 bộ sưu tập.');

        // 6. TẠO KHUYẾN MÃI (DEALS)
        await Deal.insertMany([
            {
                name: 'Xả kho Áo CLB 2023',
                price: 150000,
                originalPrice: 250000,
                image: 'https://lh3.googleusercontent.com/d/1A-cXpL8zH9Fk_M9Q7m8u5D6XJ4kR9P5m',
                discount: 40,
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                isHot: true
            },
            {
                name: 'Combo Phụ Kiện Tập Luyện',
                price: 89000,
                originalPrice: 150000,
                image: 'https://lh3.googleusercontent.com/d/1P-kXpL8zH9Fk_M9Q7m8u5D6XJ4kR9P5m',
                discount: 40,
                isHot: false
            }
        ]);
        console.log('6. Đã tạo 2 chương trình khuyến mãi.');

        // 7. TẠO BLOG
        await Blog.insertMany([
            {
                title: 'Cách lựa chọn giày đá bóng phù hợp với mặt sân',
                slug: 'cach-chon-giay-da-bong',
                excerpt: 'Việc chọn đúng loại giày theo mặt sân cỏ nhân tạo hay cỏ tự nhiên rất quan trọng...',
                image: 'https://lh3.googleusercontent.com/d/1B-lXpL8zH9Fk_M9Q7m8u5D6XJ4kR9P5m',
                content: 'Đây là nội dung chi tiết bài viết hướng dẫn chọn giày...',
                readTime: '5 phút',
                tags: ['Giày đá bóng', 'Kinh nghiệm']
            },
            {
                title: '5 Bài tập bổ trợ sức bền cho người chơi bóng đá',
                slug: 'bai-tap-suc-ben-bong-da',
                excerpt: 'Muốn duy trì thể lực suốt 90 phút thi đấu, bạn không thể bỏ qua các bài tập này.',
                image: 'https://lh3.googleusercontent.com/d/1T-pXpL8zH9Fk_M9Q7m8u5D6XJ4kR9P5m',
                content: 'Nội dung chi tiết về các bài tập gym cho cầu thủ...',
                readTime: '8 phút',
                tags: ['Tập luyện', 'Sức khỏe']
            }
        ]);
        console.log('7. Đã tạo 2 bài viết blog.');

        // 8. TẠO BANNER
        await Banner.insertMany([
            {
                title: 'MÙA GIẢI MỚI - DIỆN MẠO MỚI',
                subtitle: 'Giảm giá cực sâu các mẫu áo đấu CLB mùa 2025',
                image: 'https://lh3.googleusercontent.com/d/1H-eXpL8zH9Fk_M9Q7m8u5D6XJ4kR9P5m',
                link: '#products-page',
                type: 'hero'
            },
            {
                title: 'PHỤ KIỆN THỂ THAO CAO CẤP',
                subtitle: 'Sưu tập ngay các dụng cụ hỗ trợ tập luyện tốt nhất',
                image: 'https://lh3.googleusercontent.com/d/1S-bXpL8zH9Fk_M9Q7m8u5D6XJ4kR9P5m',
                link: '#collections-page',
                type: 'hero'
            }
        ]);
        console.log('8. Đã tạo 2 banner quảng cáo.');

        console.log('\n--- KHỞI TẠO DỮ LIỆU THÀNH CÔNG ---');
        console.log('Bây giờ bạn có thể truy cập website và khám phá!');
        process.exit();

    } catch (err) {
        console.error('--- LỖI KHI SEED DỮ LIỆU ---');
        console.error(err);
        process.exit(1);
    }
}

seedData();
