document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // KHAI BÁO BIẾN TOÀN CỤC
    // =========================
    const apiBase = "http://localhost:3000/api";
    let db = { products: [], categories: [], banners: [], blogs: [], collections: [], deals: [] };
    let cart = { items: [] };
    let currentUser = JSON.parse(sessionStorage.getItem("quangTamUser")) || null;

    // DOM Elements
    const pageLoader = document.getElementById('pageLoader');
    const mainHeader = document.getElementById('mainHeader');
    const navToggle = document.getElementById('navToggle');
    const navLinksContainer = document.getElementById('navLinks');
    const allNavLinks = document.querySelectorAll('.nav-link-item, .navigate-btn');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const currentYearEl = document.getElementById('currentYear');
    const cartIcon = document.getElementById('cartIcon');
    const cartCountEl = document.getElementById('cartCount');

    // Modals & Overlays
    const productModal = document.getElementById('productModal');
    const cartModal = document.getElementById('cartModal');
    const accountModal = document.getElementById('accountModal');
    const blogDetailModal = document.getElementById('blogDetailModal');
    const searchOverlay = document.getElementById('searchOverlay');
    
    // State variables
    let selectedProductOptions = { size: null, color: null };

    // =========================
    // KHỞI TẠO ỨNG DỤNG
    // =========================
    async function initializeApp() {
        showLoader();
        try {
            setupEventListeners();
            updateUserUI();
            await fetchData();
            renderAllPages();

            // 🟢 Gán lại sự kiện sau khi render xong
            document.querySelectorAll('.navigate-btn').forEach(btn => {
                btn.addEventListener('click', handleNavigation);
            });

            updateCartDisplay();
            navigateTo(window.location.hash.substring(1) || 'home-page', true);
        } catch (error) {
            console.error("Lỗi nghiêm trọng khi khởi tạo ứng dụng:", error);
            showToast("Đã có lỗi xảy ra. Không thể tải trang.", "error");
        } finally {
            hideLoader();
        }
    }


    // =========================
    // LẤY DỮ LIỆU TỪ API
    // =========================
    async function fetchData() {
        try {
            const endpoints = ['products', 'categories', 'banners', 'blogs', 'collections', 'deals'];
            const fetchPromises = endpoints.map(ep => 
                fetch(`${apiBase}/${ep}`).then(res => {
                    if (!res.ok) throw new Error(`Lỗi khi tải ${ep}: ${res.statusText}`);
                    return res.json();
                })
            );
            
            if (currentUser) {
                fetchPromises.push(
                    fetch(`${apiBase}/cart/${currentUser._id}`).then(res => {
                        if (!res.ok) throw new Error(`Lỗi khi tải giỏ hàng: ${res.statusText}`);
                        return res.json();
                    })
                );
            } else {
                fetchPromises.push(Promise.resolve(null)); // Thêm giá trị null cho cartData nếu không có user
            }

            const [products, categories, banners, blogs, collections, deals, cartData] = await Promise.all(fetchPromises);

            db = { products, categories, banners, blogs, collections, deals };
            if (cartData) cart = cartData;
            
            console.log("Dữ liệu đã được tải:", db);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu từ API:", error);
            showToast("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.", "error");
            // Ném lỗi để initializeApp có thể bắt và xử lý
            throw error;
        }
    }

    // =========================
    // RENDER GIAO DIỆN
    // =========================
    const formatPrice = price => price ? price.toLocaleString('vi-VN') : '0';

    function renderAllPages() {
        renderHeroBanner();
        renderFeaturedProducts();
        renderAllProducts(db.products);
        populateCategoryFilter();
        renderCollections();
        renderDeals();
        renderBlogs();
    }

    // --- Render các thành phần ---
    function renderHeroBanner() {
        const container = document.getElementById('hero-banner-container');
        if (!container) return;
        const heroBanner = db.banners.find(b => b.isActive && b.type === 'hero') || {
            title: 'Nâng Tầm Phong Cách Thể Thao',
            subtitle: 'Khám phá những bộ sưu tập đồ thể thao độc đáo, chất liệu cao cấp và thiết kế dẫn đầu xu hướng.',
            image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1920&q=80',
            link: '#products-page'
        };
        
        container.innerHTML = `
            <section class="hero" style="background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${heroBanner.image}')">
                <div class="hero-content-wrapper">
                    <div class="hero-text">
                        <h1>${heroBanner.title}</h1>
                        <p>${heroBanner.subtitle}</p>
                        <a href="${heroBanner.link}" class="btn btn-primary navigate-btn">Khám Phá Ngay <i class="fas fa-arrow-right"></i></a>
                    </div>
                </div>
            </section>`;
        // Re-attach event listener for the new button
        const newNavBtn = container.querySelector('.navigate-btn');
        if (newNavBtn) {
            newNavBtn.addEventListener('click', handleNavigation);
        }
    }

    function createProductCard(product) {
        if (!product) return '';
        const categoryName = product.category?.name || 'Chưa phân loại';
        let badge = '';
        if (product.isBestSeller) badge = `<span class="product-badge best-seller">Bán Chạy</span>`;
        else if (product.isNew) badge = `<span class="product-badge">Mới Về</span>`;
        else if (product.originalPrice > product.price) {
            const discount = Math.round((1 - product.price / product.originalPrice) * 100);
            badge = `<span class="product-badge sale">-${discount}%</span>`;
        }

        return `
            <div class="product-card" data-id="${product._id}" style="animation-delay: ${Math.random() * 0.5}s">
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    ${badge}
                    <div class="product-quick-view" data-id="${product._id}"><i class="fas fa-eye"></i> Xem Nhanh</div>
                </div>
                <div class="product-info">
                    <p class="product-category">${categoryName}</p>
                    <h3>${product.name}</h3>
                    <p class="product-price">
                        ${formatPrice(product.price)}₫
                        ${product.originalPrice > product.price ? `<span class="original-price">${formatPrice(product.originalPrice)}₫</span>` : ''}
                    </p>
                    <div class="product-actions">
                        <button class="btn btn-secondary add-to-cart-btn" data-id="${product._id}"><i class="fas fa-cart-plus"></i> Thêm Giỏ</button>
                        <button class="btn btn-outline view-details-btn" data-id="${product._id}"><i class="fas fa-info-circle"></i> Chi Tiết</button>
                    </div>
                </div>
            </div>`;
    }

    function renderFeaturedProducts() {
        const grid = document.getElementById('featured-products-grid');
        if (!grid) return;
        const featured = db.products.filter(p => p.isBestSeller).slice(0, 3);
        grid.innerHTML = featured.map(createProductCard).join('');
    }

    function renderAllProducts(products) {
        const grid = document.getElementById('all-products-grid');
        if (!grid) return;
        grid.innerHTML = products.length > 0 ? products.map(createProductCard).join('') : '<p>Không tìm thấy sản phẩm nào.</p>';
    }
    
    function renderCollections() {
        const grid = document.getElementById('collections-grid');
        if (!grid) return;
        grid.innerHTML = db.collections.map(c => `
            <div class="product-card" data-collection-id="${c._id}">
                <img src="${c.image}" alt="${c.name}">
                <div class="product-info">
                    <h3>${c.name}</h3>
                    <p>${c.description}</p>
                    <button class="btn btn-secondary navigate-btn" href="#products-page" data-category-filter="${c.products[0]?.category}">Xem Sản Phẩm</button>
                </div>
            </div>
        `).join('');
    }

    function renderDeals() {
        const grid = document.getElementById('deals-grid');
        if (!grid) return;
        const deals = db.products.filter(p => p.originalPrice > p.price).slice(0, 3);
        grid.innerHTML = deals.map(createProductCard).join('');
    }

    function renderBlogs() {
        const grid = document.getElementById('blog-grid');
        if (!grid) return;
        grid.innerHTML = db.blogs.map(b => `
            <article class="blog-post-summary" data-id="${b._id}">
                <img src="${b.image}" alt="${b.title}" loading="lazy">
                <div class="blog-info">
                    <h3>${b.title}</h3>
                    <p>${b.excerpt}</p>
                    <a href="#" class="btn btn-outline btn-small read-more-blog-btn" data-id="${b._id}">Đọc thêm <i class="fas fa-arrow-right"></i></a>
                </div>
            </article>
        `).join('');
    }

    function populateCategoryFilter() {
        const select = document.getElementById('categoryFilter');
        if (!select) return;
        select.innerHTML = '<option value="all">Tất cả danh mục</option>' + 
                           db.categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
    }
    
    // =========================
    // ĐIỀU HƯỚNG & SỰ KIỆN
    // =========================
    // SỬA ĐỔI: Hàm này được làm "an toàn" hơn bằng cách kiểm tra phần tử trước khi gán sự kiện
    function setupEventListeners() {
        // Helper function to safely add event listeners
        const safeAddEventListener = (selector, event, handler) => {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.warn(`Cảnh báo: Không tìm thấy phần tử với selector "${selector}" để gán sự kiện.`);
            }
        };

        // Header & Nav
        window.addEventListener('scroll', handleScroll);
        if (navToggle) navToggle.addEventListener('click', toggleMobileMenu);
        allNavLinks.forEach(link => link.addEventListener('click', handleNavigation));
        window.addEventListener('hashchange', () => navigateTo(window.location.hash.substring(1), true));

        // Search
        safeAddEventListener('#searchIconBtn', 'click', openSearch);
        safeAddEventListener('#closeSearchOverlayBtn', 'click', closeSearch);
        safeAddEventListener('#searchInput', 'input', debounce(handleSearch, 300));
        
        // Modals
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) closeAllModals();
        });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAllModals();
        });
        
        // Account
        // Gán sự kiện cho user-account-section vì nút accountIconBtn có thể bị thay thế
        safeAddEventListener('#user-account-section', 'click', (e) => {
            if (e.target.closest('#accountIconBtn')) {
                e.preventDefault();
                openModal(accountModal);
            }
        });
        safeAddEventListener('#closeAccountModalBtn', 'click', () => closeModal(accountModal));
        document.querySelectorAll('.tab-link').forEach(tab => tab.addEventListener('click', switchAuthTab));
        safeAddEventListener('#loginForm', 'submit', handleLogin);
        safeAddEventListener('#registerForm', 'submit', handleRegister);

        // Dynamic content clicks (delegation)
        document.body.addEventListener('click', (e) => {
            const viewDetailsBtn = e.target.closest('.view-details-btn, .product-quick-view');
            const addToCartBtn = e.target.closest('.add-to-cart-btn');
            const readMoreBlogBtn = e.target.closest('.read-more-blog-btn');
            const closeModalBtn = e.target.closest('.close-btn');

            if (viewDetailsBtn) {
                e.preventDefault();
                openProductModal(viewDetailsBtn.dataset.id);
            }
            if (addToCartBtn) {
                e.preventDefault();
                handleAddToCart(addToCartBtn.dataset.id);
            }
            if (readMoreBlogBtn) {
                e.preventDefault();
                openBlogDetailModal(readMoreBlogBtn.dataset.id);
            }
            if (closeModalBtn) {
                const modalToClose = e.target.closest('.modal');
                if (modalToClose) closeModal(modalToClose);
            }
        });

        // Product Filters
        safeAddEventListener('#categoryFilter', 'change', filterAndSortProducts);
        safeAddEventListener('#sortFilter', 'change', filterAndSortProducts);
        
        // Cart
        if (cartIcon) cartIcon.addEventListener('click', (e) => { e.preventDefault(); openCartModal(); });
        safeAddEventListener('#continueShoppingBtn', 'click', () => closeModal(cartModal));
        safeAddEventListener('#checkoutBtn', 'click', handleCheckout);
        safeAddEventListener('#closeSuccessMsgBtn', 'click', () => closeModal(cartModal));
        
        // Footer
        if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();
        safeAddEventListener('#newsletterForm', 'submit', (e) => {
            e.preventDefault();
            showToast('Cảm ơn bạn đã đăng ký!', 'success');
            e.target.reset();
        });
        
        // Scroll to top
        if (scrollToTopBtn) scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    function handleNavigation(e) {
        e.preventDefault();
        const target = e.currentTarget;
        if (target.hasAttribute('href')) {
            const targetPageId = target.getAttribute('href').substring(1);
            navigateTo(targetPageId);
            if (navLinksContainer.classList.contains('active')) {
                toggleMobileMenu();
            }
        }
    }

    function navigateTo(pageId, isInitial = false) {
        if (!pageId) pageId = 'home-page';
        document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active-page'));
        document.querySelectorAll('.nav-link-item').forEach(l => {
            l.classList.remove('active');
            if (l.getAttribute('href') === `#${pageId}`) {
                l.classList.add('active');
            }
        });
        
        const pageToShow = document.getElementById(pageId);
        if (pageToShow) {
            pageToShow.classList.add('active-page');
            if (!isInitial) {
                // Chỉ thay đổi hash, không scroll ngay lập tức
                window.history.pushState(null, '', `#${pageId}`);
                // Scroll lên đầu trang
                document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else {
            // Nếu không tìm thấy trang, quay về trang chủ
            if (pageId !== 'home-page') {
                navigateTo('home-page');
            }
        }
    }

    function filterAndSortProducts() {
        const categoryFilter = document.getElementById('categoryFilter');
        const sortFilter = document.getElementById('sortFilter');
        
        const categoryId = categoryFilter ? categoryFilter.value : 'all';
        const sortValue = sortFilter ? sortFilter.value : 'default';
        
        let filteredProducts = [...db.products];

        if (categoryId !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category?._id === categoryId);
        }

        switch (sortValue) {
            case 'price-asc':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }
        renderAllProducts(filteredProducts);
    }
    
    // =========================
    // MODAL HANDLING
    // =========================
    function openModal(modal) {
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
        // Chỉ khôi phục scroll nếu không còn modal nào đang mở
        if (!document.querySelector('.modal[style*="display: block"]')) {
            document.body.style.overflow = 'auto';
        }
    }

    function closeAllModals() {
        [productModal, cartModal, accountModal, blogDetailModal, searchOverlay].forEach(m => {
            if (m) m.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }
    
    // --- Product Modal ---
    function openProductModal(productId) {
        const product = db.products.find(p => p._id === productId);
        if (!product || !productModal) return;

        productModal.dataset.productId = productId;
        productModal.querySelector('#modalProductName').textContent = product.name;
        productModal.querySelector('#modalProductImage').src = product.image;
        productModal.querySelector('#modalProductPrice').textContent = `${formatPrice(product.price)}₫`;
        productModal.querySelector('#modalProductDescription').textContent = product.description;
        
        const optionsContainer = productModal.querySelector('#modal-options-container');
        optionsContainer.innerHTML = '';
        selectedProductOptions = { size: null, color: null };

        if (product.sizes && product.sizes.length > 0) {
            selectedProductOptions.size = product.sizes[0];
            optionsContainer.innerHTML += createOptionSelector('Kích Cỡ', 'size', product.sizes, selectedProductOptions.size);
        }
        if (product.colors && product.colors.length > 0) {
            selectedProductOptions.color = product.colors[0];
            optionsContainer.innerHTML += createOptionSelector('Màu Sắc', 'color', product.colors, selectedProductOptions.color);
        }

        optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { type, value } = e.currentTarget.dataset;
                selectedProductOptions[type] = value;
                e.currentTarget.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
            });
        });

        productModal.querySelector('#modalQuantityInput').value = 1;
        const addToCartBtn = productModal.querySelector('.add-to-cart-modal-btn');
        if (addToCartBtn) {
            addToCartBtn.onclick = () => {
                handleAddToCart(productId, productModal.querySelector('#modalQuantityInput').value);
                closeModal(productModal);
            };
        }
        openModal(productModal);
    }

    function createOptionSelector(label, type, options, defaultOption) {
        return `
            <div class="option-container">
                <label>${label}:</label>
                <div class="options-wrapper">
                    ${options.map(opt => `<button class="option-btn ${opt === defaultOption ? 'selected' : ''}" data-type="${type}" data-value="${opt}">${opt}</button>`).join('')}
                </div>
            </div>`;
    }

    // --- Blog Detail Modal ---
    function openBlogDetailModal(blogId) {
        const blog = db.blogs.find(b => b._id === blogId);
        if (!blog || !blogDetailModal) return;

        blogDetailModal.querySelector('#blogModalTitle').textContent = blog.title;
        blogDetailModal.querySelector('#blogModalImage').src = blog.image;
        blogDetailModal.querySelector('#blogModalDate').textContent = new Date(blog.date).toLocaleDateString('vi-VN');
        blogDetailModal.querySelector('#blogModalAuthor').textContent = blog.author;
        blogDetailModal.querySelector('#blogModalContent').innerHTML = blog.content.replace(/\n/g, '<br>');
        
        openModal(blogDetailModal);
    }

    // =========================
    // USER AUTHENTICATION
    // =========================
    function updateUserUI() {
        const userSection = document.getElementById('user-account-section');
        if (!userSection) return;

        if (currentUser) {
            userSection.innerHTML = `
                <span class="user-welcome-msg">Chào, <span>${currentUser.fullName.split(' ').pop()}</span>!</span>
                <button id="logoutBtn" title="Đăng xuất"><i class="fas fa-sign-out-alt"></i></button>`;
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
        } else {
            userSection.innerHTML = `<a href="#" class="icon-link" id="accountIconBtn" aria-label="Tài khoản"><i class="fas fa-user-circle"></i></a>`;
            // Event listener for accountIconBtn is already handled by delegation in setupEventListeners
        }
    }

    function switchAuthTab(e) {
        const formId = e.currentTarget.dataset.form;
        const formContainer = e.target.closest('.account-form-container');
        if (!formContainer) return;

        formContainer.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
        formContainer.querySelectorAll('.account-form').forEach(f => f.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const formToShow = formContainer.querySelector(`#${formId}`);
        if(formToShow) formToShow.classList.add('active');
    }

    async function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorEl = document.getElementById('loginError');
        errorEl.style.display = 'none';

        try {
            const res = await fetch(`${apiBase}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.success) {
                currentUser = data.user;
                sessionStorage.setItem('quangTamUser', JSON.stringify(currentUser));
                showToast(`Chào mừng ${currentUser.fullName}!`, 'success');
                closeModal(accountModal);
                await initializeApp(); // Re-initialize to fetch user-specific data like cart
            } else {
                errorEl.textContent = data.message;
                errorEl.style.display = 'block';
            }
        } catch (err) {
            errorEl.textContent = 'Lỗi kết nối máy chủ. Vui lòng thử lại.';
            errorEl.style.display = 'block';
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        const fullName = document.getElementById('registerFullName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const errorEl = document.getElementById('registerError');
        errorEl.style.display = 'none';

        if (password !== confirmPassword) {
            errorEl.textContent = 'Mật khẩu xác nhận không khớp.';
            errorEl.style.display = 'block';
            return;
        }

        try {
            const res = await fetch(`${apiBase}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password })
            });
            const data = await res.json();
            if (data.success) {
                showToast('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
                document.querySelector('[data-form="loginForm"]').click();
                document.getElementById('loginEmail').value = email;
            } else {
                errorEl.textContent = data.message;
                errorEl.style.display = 'block';
            }
        } catch (err) {
            errorEl.textContent = 'Lỗi kết nối máy chủ. Vui lòng thử lại.';
            errorEl.style.display = 'block';
        }
    }

    function handleLogout() {
        sessionStorage.removeItem('quangTamUser');
        currentUser = null;
        cart = { items: [] };
        showToast('Bạn đã đăng xuất.', 'info');
        updateUserUI();
        updateCartDisplay();
    }

    // =========================
    // CART & CHECKOUT
    // =========================
    function openCartModal() {
        if (!currentUser) {
            showToast('Vui lòng đăng nhập để xem giỏ hàng.', 'info');
            openModal(accountModal);
            return;
        }
        updateCartDisplay();
        openModal(cartModal);
    }
    
    async function handleAddToCart(productId, quantity = 1) {
        if (!currentUser) {
            showToast('Vui lòng đăng nhập để thêm sản phẩm.', 'info');
            openModal(accountModal);
            return;
        }
        
        const product = db.products.find(p => p._id === productId);
        if (!product) return;

        try {
            const res = await fetch(`${apiBase}/cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser._id,
                    productId: productId,
                    quantity: parseInt(quantity, 10),
                    size: selectedProductOptions.size,
                    color: selectedProductOptions.color
                })
            });
            const updatedCart = await res.json();
            if (res.ok) {
                cart = updatedCart;
                updateCartDisplay();
                showToast(`${product.name} đã được thêm vào giỏ!`, 'success');
                if (cartIcon) {
                    cartIcon.classList.add('shake-animation');
                    setTimeout(() => cartIcon.classList.remove('shake-animation'), 600);
                }
            } else {
                throw new Error(updatedCart.message || 'Lỗi không xác định');
            }
        } catch (error) {
            console.error('Lỗi thêm vào giỏ hàng:', error);
            showToast(`Có lỗi xảy ra: ${error.message}`, 'error');
        }
    }

    function updateCartDisplay() {
        if (!cartModal) return;
        const itemsList = cartModal.querySelector('#cart-items-list');
        const emptyMsg = cartModal.querySelector('#emptyCartMsg');
        const summaryDiv = cartModal.querySelector('#cart-summary');
        const totalAmountEl = cartModal.querySelector('#cartTotalAmount');
        const checkoutBtn = cartModal.querySelector('#checkoutBtn');
        const cartItemsContainer = cartModal.querySelector('#cart-items-container');
        const orderSuccessMsg = cartModal.querySelector('#orderSuccessMsg');
        const cartModalFooter = cartModal.querySelector('#cartModalFooter');

        // Reset state
        if (orderSuccessMsg) orderSuccessMsg.style.display = 'none';
        if (cartItemsContainer) cartItemsContainer.style.display = 'block';
        if (summaryDiv) summaryDiv.style.display = 'block';
        if (cartModalFooter) cartModalFooter.style.display = 'flex';

        const totalItems = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        if (cartCountEl) {
            cartCountEl.textContent = totalItems;
            cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        if (!cart.items || cart.items.length === 0) {
            if (itemsList) itemsList.innerHTML = '';
            if (emptyMsg) emptyMsg.style.display = 'block';
            if (summaryDiv) summaryDiv.style.display = 'none';
            if (checkoutBtn) checkoutBtn.style.display = 'none';
            return;
        }

        if (emptyMsg) emptyMsg.style.display = 'none';
        if (summaryDiv) summaryDiv.style.display = 'block';
        if (checkoutBtn) checkoutBtn.style.display = 'inline-block';
        
        if (itemsList) {
            itemsList.innerHTML = cart.items.map(item => {
                const product = item.product;
                if (!product) return '';
                return `
                <div class="cart-item" data-item-id="${item._id}">
                    <img src="${product.image}" alt="${product.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <strong>${product.name}</strong>
                        <p class="item-price">${formatPrice(product.price)}₫</p>
                        ${item.size ? `<small>Cỡ: ${item.size}</small>` : ''}
                        ${item.color ? `<small> | Màu: ${item.color}</small>` : ''}
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease-qty" onclick="updateCartItemQuantity('${item.product._id}', '${item.size}', '${item.color}', -1)"><i class="fas fa-minus-circle"></i></button>
                        <input type="number" value="${item.quantity}" min="1" readonly>
                        <button class="quantity-btn increase-qty" onclick="updateCartItemQuantity('${item.product._id}', '${item.size}', '${item.color}', 1)"><i class="fas fa-plus-circle"></i></button>
                    </div>
                    <button class="remove-item-btn" onclick="removeCartItem('${item.product._id}', '${item.size}', '${item.color}')" aria-label="Xóa sản phẩm"><i class="fas fa-trash-alt"></i></button>
                </div>`;
            }).join('');
        }

        const totalAmount = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        if (totalAmountEl) totalAmountEl.textContent = formatPrice(totalAmount);
    }
    
    window.updateCartItemQuantity = async function(productId, size, color, change) {
        try {
            const res = await fetch(`${apiBase}/cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser._id, productId, quantity: change, size: size === 'null' ? null : size, color: color === 'null' ? null : color })
            });
            const updatedCart = await res.json();
            if (res.ok) {
                cart = updatedCart;
                updateCartDisplay();
            } else throw new Error(updatedCart.message);
        } catch (error) {
            showToast('Lỗi cập nhật giỏ hàng.', 'error');
        }
    }

    window.removeCartItem = async function(productId, size, color) {
        const itemToRemove = cart.items.find(i => i.product._id === productId && i.size == (size === 'null' ? null : size) && i.color == (color === 'null' ? null : color));
        if (!itemToRemove) return;

        if (confirm(`Bạn có chắc muốn xóa "${itemToRemove.product.name}" khỏi giỏ hàng?`)) {
            await updateCartItemQuantity(productId, size, color, -itemToRemove.quantity);
        }
    }

    async function handleCheckout() {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const address = document.getElementById('customerAddress').value.trim();

        if (!name || !phone || !address) {
            showToast('Vui lòng điền đầy đủ thông tin giao hàng.', 'error');
            return;
        }

        const orderPayload = {
            user: currentUser._id,
            customerInfo: { name, phone, address },
            items: cart.items.map(i => ({
                product: i.product._id,
                name: i.product.name,
                price: i.product.price,
                quantity: i.quantity,
                size: i.size,
                color: i.color
            })),
            totalAmount: cart.items.reduce((sum, i) => sum + (i.product.price * i.quantity), 0),
            paymentMethod: document.getElementById('paymentMethod').value
        };

        try {
            const res = await fetch(`${apiBase}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });
            const orderData = await res.json();
            if (res.ok) {
                document.getElementById('cart-items-container').style.display = 'none';
                document.getElementById('cart-summary').style.display = 'none';
                document.getElementById('cartModalFooter').style.display = 'none';
                document.getElementById('orderSuccessId').textContent = orderData.orderId;
                document.getElementById('orderSuccessMsg').style.display = 'block';
                
                cart = { items: [] };
                updateCartDisplay();
            } else {
                throw new Error(orderData.message);
            }
        } catch (error) {
            showToast('Đặt hàng thất bại. Vui lòng thử lại.', 'error');
        }
    }

    // =========================
    // SEARCH
    // =========================
    function openSearch(e) {
        e.preventDefault();
        if (searchOverlay) {
            searchOverlay.style.display = 'flex';
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.focus();
            document.body.style.overflow = 'hidden';
        }
    }

    function closeSearch() {
        if (searchOverlay) {
            searchOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    function handleSearch() {
        const searchInput = document.getElementById('searchInput');
        const resultsContainer = document.getElementById('searchResultsContainer');
        if (!searchInput || !resultsContainer) return;

        const query = searchInput.value.toLowerCase().trim();

        if (query.length < 2) {
            resultsContainer.innerHTML = '<p>Nhập ít nhất 2 ký tự để tìm kiếm.</p>';
            return;
        }

        const results = db.products.filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.category?.name.toLowerCase().includes(query)
        );

        if (results.length > 0) {
            resultsContainer.innerHTML = `<ul>${results.slice(0, 5).map(p => `
                <li><a href="#" class="search-result-item" data-id="${p._id}">${p.name} - ${p.category.name}</a></li>
            `).join('')}</ul>`;
            resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    closeSearch();
                    openProductModal(e.currentTarget.dataset.id);
                });
            });
        } else {
            resultsContainer.innerHTML = '<p>Không tìm thấy sản phẩm nào phù hợp.</p>';
        }
    }

    // =========================
    // UI HELPERS & EFFECTS
    // =========================
    function showLoader() { 
        if (pageLoader) {
            pageLoader.style.display = 'flex'; 
            pageLoader.classList.remove('hidden'); 
        }
    }
    function hideLoader() { 
        if (pageLoader) {
            pageLoader.classList.add('hidden');
            setTimeout(() => { pageLoader.style.display = 'none'; }, 500);
        }
    }

    let lastScrollTop = 0;
    function handleScroll() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (mainHeader) {
            if (scrollTop > lastScrollTop && scrollTop > 150) {
                mainHeader.classList.add('header-hidden');
            } else {
                mainHeader.classList.remove('header-hidden');
            }
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        if (scrollToTopBtn) {
            scrollToTopBtn.style.display = (scrollTop > 300) ? 'block' : 'none';
        }
    }

    function toggleMobileMenu() {
        if (navLinksContainer && navToggle) {
            navLinksContainer.classList.toggle('active');
            navToggle.querySelector('i').classList.toggle('fa-bars');
            navToggle.querySelector('i').classList.toggle('fa-times');
        }
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        let iconClass = 'fa-info-circle';
        if (type === 'success') iconClass = 'fa-check-circle';
        if (type === 'error') iconClass = 'fa-exclamation-circle';
        
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="fas ${iconClass}"></i> ${message}`;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3500);
    }
    
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // =========================
    // RUN APP
    // =========================
    initializeApp();
});