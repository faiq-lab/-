// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", async () => {
    // Initialize URL handling
    await initializeApp();
});

async function initializeApp() {
    const urlParams = new URLSearchParams(location.search);
    let id = urlParams.get("id") || localStorage.getItem("lastCardId");
    
    console.log("Initial ID from URL:", id);
    
    // Handle short ID (6 characters)
    if (id && id.length === 6) {
        console.log("Detected short ID (6 chars), looking up full ID...");
        const { data: mapping } = await window.supabaseClient
            .from('short_urls')
            .select('full_id')
            .eq('short_id', id)
            .single();
        
        if (mapping) {
            id = mapping.full_id;
            window.appState.shortCardId = mapping.short_id;
            console.log("Found mapping: short", window.appState.shortCardId, "-> full", id.substring(0, 8) + "...");
        } else {
            showBusinessNotFound();
            return;
        }
    }
    
    if (!id) {
        showBusinessNotFound();
        return;
    }
    
    // Set business ID
    localStorage.setItem("lastCardId", id);
    window.appState.currentBusinessId = id;
    
    // Load saved data
    loadSavedData();
    
    // Fetch business data
    await fetchBusinessData(id);
}

function showBusinessNotFound() {
    document.body.innerHTML = `
        <div style="padding:40px;text-align:center;color:white;">
            <h2>Business Not Found</h2>
            <p>The business you're looking for doesn't exist or has been removed.</p>
            <button onclick="location.href='index.html'" style="margin-top:20px;padding:12px 24px;background:white;color:#667eea;border:none;border-radius:12px;font-weight:700;cursor:pointer;">
                Create Your Business Card
            </button>
        </div>
    `;
}

function loadSavedData() {
    // Load cart
    const savedCart = window.isolatedStorage.getItem('cart');
    window.appState.cart = savedCart ? JSON.parse(savedCart) : [];
    
    // Load addresses
    const savedAddresses = window.isolatedStorage.getItem('addresses');
    window.appState.addresses = savedAddresses ? JSON.parse(savedAddresses) : [];
    
    // Load admin login status
    window.appState.isAdminLoggedIn = window.isolatedStorage.getItem('isAdminLoggedIn') === 'true';
    
    // Load notifications
    window.notifications.loadInnerNotifications();
    
    // Initialize customer data
    initCustomerData();
}

async function fetchBusinessData(id) {
    const { data, error } = await window.supabaseClient
        .from("cards")
        .select("*")
        .eq("id", id)
        .single();
    
    if (error || !data) {
        showBusinessNotFound();
        return;
    }
    
    window.appState.card = JSON.parse(data.data);
    window.appState.card.id = data.id;
    
    // Save business phone
    if (window.appState.card.phone) {
        window.utils.saveBusinessPhone(window.appState.card.phone);
    }
    
    // Generate admin password
    window.appState.businessAdminPassword = generateAdminPassword(
        window.appState.card.id, 
        window.appState.shortCardId
    );
    
    console.log("Admin password generated:", window.appState.businessAdminPassword);
    
    // Update password hint
    if (window.appState.shortCardId) {
        document.getElementById('passwordHint').textContent = 
            `Hint: Password format is business123_${window.appState.shortCardId.toLowerCase()}`;
    }
    
    // Render app
    await renderApp();
    
    // Initialize routing
    initializeRouting();
    
    // Update UI
    window.appState.navigationHistory = ['homePage'];
    updateCartCount();
    window.admin.updateLoginUI();
    updateCustomerPhoneDisplay();
    window.notifications.updateNotificationBellCount();
    
    // Initialize address system
    window.address.initAddressSystem();
    
    // Initialize delivery settings
    window.delivery.initDeliverySettings();
    
    // Check for deliveries
    setTimeout(() => {
        window.delivery.checkForDeliveries();
    }, 1000);
    
    // Add welcome notification
    setTimeout(() => {
        if (window.appState.innerNotifications.length === 0) {
            window.notifications.addInnerNotification('Welcome!', 'Get started by browsing products or enabling notifications', 'info');
        }
    }, 2000);
    
    // Show install permission modal
    setTimeout(() => {
        showInstallPermissionModal();
    }, 5000);
}

function initCustomerData() {
    window.appState.customerData.deviceId = window.utils.generateDeviceId();
    window.appState.customerData.installDate = new Date().toISOString();
    window.appState.customerData.lastActive = new Date().toISOString();
    window.appState.customerData.phone = window.utils.getCustomerPhone() || '';
    
    // Load saved customer name and email
    const savedName = window.isolatedStorage.getItem('customerName');
    const savedEmail = window.isolatedStorage.getItem('customerEmail');
    window.appState.customerData.name = savedName || '';
    window.appState.customerData.email = savedEmail || '';
}

function generateAdminPassword(cardId, shortId) {
    if (!cardId) return "admin123_default";
    const shortPart = shortId ? shortId.toLowerCase() : cardId.substring(0, 6).toLowerCase();
    return `business123_${shortPart}`;
}

// ===== RENDERING FUNCTIONS =====
async function renderApp() {
    setupDynamicPWA(window.appState.card);
    
    document.getElementById('businessHeader').textContent = 
        window.appState.card.businessName || window.appState.card.name || "Premium Business";
    
    const photo = document.getElementById('photo');
    const photoContainer = document.getElementById('photoContainer');
    
    if (window.appState.card.profileImage) {
        photo.src = window.appState.card.profileImage;
        photo.onerror = handleProfileImageError;
    } else {
        handleProfileImageError();
    }
    
    document.getElementById('name').textContent = window.appState.card.name || "";
    document.getElementById('business').textContent = window.appState.card.businessName || "";
    document.getElementById('contactPhone').textContent = window.appState.card.phone || "Not available";
    document.getElementById('contactEmail').textContent = window.appState.card.email || "Not available";
    document.getElementById('contactAddress').textContent = window.appState.card.address || "Not available";
    
    loadHomePage();
}

function setupDynamicPWA(businessData) {
    const businessName = businessData.businessName || businessData.name || "Business";
    const appName = businessName + " App";
    
    document.title = appName;
    document.getElementById('loadingTitle').textContent = appName;
    document.getElementById('loadingSubtitle').textContent = `Loading ${businessName} experience...`;
}

function handleProfileImageError() {
    const photo = document.getElementById('photo');
    const photoContainer = document.getElementById('photoContainer');
    
    if (photo) {
        photo.style.display = 'none';
    }
    
    if (photoContainer) {
        const businessName = window.appState.card.businessName || window.appState.card.name || "Business";
        const initials = businessName.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
        
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
        ];
        
        const colorIndex = businessName.length % colors.length;
        photoContainer.style.background = colors[colorIndex];
        photoContainer.innerHTML = `<span style="color:white;font-size:36px;font-weight:bold;">${initials}</span>`;
    }
}

// ===== NAVIGATION =====
let navigationHistory = [];

function initializeRouting() {
    window.addEventListener('hashchange', handleHashChange);
    
    setTimeout(() => {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            handleHashChange();
        } else {
            window.location.hash = '#home';
        }
    }, 100);
}

function handleHashChange() {
    const hash = window.location.hash.replace('#', '');
    const pageMap = {
        'home': 'homePage',
        'products': 'productsPage',
        'cart': 'cartPage',
        'about': 'aboutPage',
        'contact': 'contactPage',
        'address': 'addressPage',
        'delivery': 'deliveryPage',
        'admin': 'adminPage',
        'login': 'loginPage',
        'checkout': 'checkoutPage',
        'confirmation': 'confirmationPage'
    };
    
    if (pageMap[hash]) {
        if (window.appState.currentPage !== pageMap[hash]) {
            navigateToDirect(pageMap[hash]);
        }
    } else {
        window.location.hash = '#home';
    }
}

function navigateToDirect(pageId) {
    if (window.appState.currentPage === pageId) return;
    
    const oldPage = document.getElementById(window.appState.currentPage);
    const newPage = document.getElementById(pageId);
    
    if (oldPage) {
        oldPage.classList.remove('active');
        oldPage.classList.add('slide-out');
    }
    
    setTimeout(() => {
        if (oldPage) oldPage.classList.remove('slide-out');
        newPage.classList.add('active');
        window.appState.currentPage = pageId;
        
        // Show/hide back button
        const backBtn = document.getElementById('headerBackBtn');
        backBtn.style.display = pageId !== 'homePage' ? 'flex' : 'none';
        
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const navMap = {
            'homePage': 0,
            'productsPage': 1,
            'cartPage': 2,
            'aboutPage': 3,
            'contactPage': 4,
            'addressPage': 4,
            'deliveryPage': 0,
            'adminPage': 0,
            'loginPage': 0,
            'checkoutPage': 0,
            'confirmationPage': 0
        };
        
        if (navMap[pageId] !== undefined) {
            document.querySelectorAll('.nav-item')[navMap[pageId]].classList.add('active');
        }
        
        // Close notification drawer
        document.getElementById('notificationDrawer').classList.remove('open');
        
        // Load page content
        switch(pageId) {
            case 'homePage':
                loadHomePage();
                break;
            case 'productsPage':
                loadProductsPage();
                break;
            case 'cartPage':
                loadCartPage();
                break;
            case 'aboutPage':
                loadAboutPage();
                break;
            case 'contactPage':
                loadContactPage();
                break;
            case 'addressPage':
                window.address.loadAddressPage();
                break;
            case 'deliveryPage':
                window.delivery.loadDeliveryStatus();
                break;
            case 'adminPage':
                if (window.appState.isAdminLoggedIn) {
                    window.admin.loadAdminPanel();
                } else {
                    navigateTo('loginPage');
                }
                break;
            case 'checkoutPage':
                window.checkout.loadCheckoutPage();
                break;
            case 'confirmationPage':
                // Already loaded
                break;
        }
    }, 300);
}

function navigateTo(pageId) {
    const hashMap = {
        'homePage': 'home',
        'productsPage': 'products',
        'cartPage': 'cart',
        'aboutPage': 'about',
        'contactPage': 'contact',
        'addressPage': 'address',
        'deliveryPage': 'delivery',
        'adminPage': 'admin',
        'loginPage': 'login',
        'checkoutPage': 'checkout',
        'confirmationPage': 'confirmation'
    };
    
    if (hashMap[pageId]) {
        window.location.hash = `#${hashMap[pageId]}`;
        navigationHistory.push(pageId);
    }
}

function goBack() {
    if (document.getElementById('notificationDrawer').classList.contains('open')) {
        window.notifications.toggleNotificationDrawer();
        return;
    }
    
    if (navigationHistory.length > 1) {
        navigationHistory.pop();
        const previousPage = navigationHistory[navigationHistory.length - 1];
        navigateTo(previousPage);
    } else {
        navigateTo('homePage');
    }
}

// ===== CART MANAGEMENT =====
function updateCartCount() {
    const count = window.appState.cart.length;
    document.getElementById('cartCountMini').textContent = count;
    document.getElementById('cartBadge').textContent = count;
    
    window.isolatedStorage.setItem('cart', JSON.stringify(window.appState.cart));
}

function addToCart(productIndex) {
    const products = window.appState.card.products || [];
    const product = products[productIndex];
    
    if (product) {
        const existingIndex = window.appState.cart.findIndex(item => 
            item.title === product.title && 
            item.discountPrice === product.discountPrice
        );
        
        if (existingIndex === -1) {
            window.appState.cart.push({
                ...product,
                index: productIndex,
                quantity: 1
            });
        } else {
            window.appState.cart[existingIndex].quantity = (window.appState.cart[existingIndex].quantity || 1) + 1;
        }
        updateCartCount();
        window.notifications.showNotification('Product added to cart!');
        window.notifications.addInnerNotification('Cart Updated', `${product.title} added to cart`, 'info');
    }
}

function removeFromCart(index) {
    if (window.appState.cart[index]) {
        const productName = window.appState.cart[index].title;
        window.appState.cart.splice(index, 1);
        updateCartCount();
        window.notifications.showNotification('Product removed from cart!');
        window.notifications.addInnerNotification('Cart Updated', `${productName} removed from cart`, 'info');
        loadCartPage();
    }
}

function updateQuantity(index, change) {
    if (window.appState.cart[index]) {
        const oldQty = window.appState.cart[index].quantity || 1;
        window.appState.cart[index].quantity = Math.max(1, oldQty + change);
        loadCartPage();
        updateCartCount();
    }
}

function loadCartPage() {
    const cartContent = document.getElementById('cartContent');
    const cartItemsCount = document.getElementById('cartItemsCount');
    
    if (window.appState.cart.length === 0) {
        cartContent.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Add some products to get started</p>
                <button onclick="navigateTo('productsPage')">
                    Browse Products
                </button>
            </div>
        `;
        cartItemsCount.textContent = '0 items';
        return;
    }
    
    let html = '<div class="cart-items">';
    let total = 0;
    
    window.appState.cart.forEach((item, index) => {
        const price = parseFloat(item.discountPrice || item.originalPrice || 0);
        const itemTotal = price * (item.quantity || 1);
        total += itemTotal;
        
        html += `
            <div class="cart-item">
                <img src="${item.image || ''}" class="cart-item-img" loading="lazy" onerror="this.style.display='none'">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.title || 'Product'}</div>
                    <div class="cart-item-price">PKR ${itemTotal.toFixed(2)}</div>
                    <div class="cart-item-actions">
                        <div class="quantity-control">
                            <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                            <span class="quantity">${item.quantity || 1}</span>
                            <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                        </div>
                        <button class="remove-btn" onclick="removeFromCart(${index})">
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    html += `
        <div class="cart-summary">
            <h3><i class="fas fa-receipt"></i> Order Summary</h3>
            <div class="summary-row">
                <span>Subtotal</span>
                <span>PKR ${total.toFixed(2)}</span>
            </div>
            <div class="summary-row summary-total">
                <span>Total</span>
                <span>PKR ${total.toFixed(2)}</span>
            </div>
            <button class="checkout-btn" onclick="window.checkout.startCheckout()">
                <i class="fas fa-lock"></i> Proceed to Checkout
            </button>
        </div>
    `;
    
    cartContent.innerHTML = html;
    cartItemsCount.textContent = `${window.appState.cart.length} ${window.appState.cart.length === 1 ? 'item' : 'items'}`;
}

function loadHomePage() {
    const featuredProducts = document.getElementById('featuredProducts');
    const products = window.appState.card.products || [];
    
    featuredProducts.innerHTML = '';
    
    const featuredProductsList = products.filter(product => 
        product.badges && product.badges.length > 0
    ).slice(0, 4);
    
    featuredProductsList.forEach((product, index) => {
        const originalIndex = products.findIndex(p => p.title === product.title);
        featuredProducts.appendChild(createProductCard(product, originalIndex));
    });
    
    if (featuredProductsList.length === 0) {
        products.slice(0, 4).forEach((product, index) => {
            featuredProducts.appendChild(createProductCard(product, index));
        });
    }
}

function loadProductsPage() {
    const allProducts = document.getElementById('allProducts');
    const products = window.appState.card.products || [];
    
    allProducts.innerHTML = '';
    
    products.forEach((product, index) => {
        allProducts.appendChild(createProductCard(product, index));
    });
}

function createProductCard(product, index) {
    const price = product.discountPrice || product.originalPrice;
    const originalPrice = product.originalPrice && product.discountPrice ? product.originalPrice : null;
    const hasDiscount = originalPrice && price && originalPrice > price;
    
    let discountPercentage = '';
    if (hasDiscount && originalPrice && price) {
        const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
        if (discount > 0) {
            discountPercentage = `<div class="discount-badge">${discount}% OFF</div>`;
        }
    }
    
    let priceBadgeHtml = '';
    if (price) {
        priceBadgeHtml = `<div class="price-badge">`;
        if (hasDiscount && originalPrice) {
            priceBadgeHtml += `<div class="original-price">PKR ${originalPrice}</div>`;
            priceBadgeHtml += `<div class="current-price">PKR ${price}</div>`;
        } else {
            priceBadgeHtml += `<div class="current-price">PKR ${price}</div>`;
        }
        priceBadgeHtml += `</div>`;
    }
    
    const badgeClasses = {
        '🔥 Hot Deal': 'hot',
        '⭐ Best Seller': 'best-seller',
        '💸 Discount': 'discount',
        '⏳ Limited Stock': 'limited',
        '🛒 In Stock': 'stock',
        '🚚 Free Delivery': 'delivery'
    };
    
    let badgesHtml = '';
    if (product.badges && product.badges.length > 0) {
        badgesHtml = `<div class="product-badges">`;
        product.badges.slice(0, 2).forEach(badge => {
            const badgeClass = badgeClasses[badge] || 'discount';
            badgesHtml += `<span class="badge ${badgeClass}">${badge}</span>`;
        });
        badgesHtml += `</div>`;
    }
    
    const cardElement = document.createElement('div');
    cardElement.className = 'product-card';
    
    cardElement.innerHTML = `
        <div class="product-image-container" onclick="zoomImage('${product.image || ''}', event)">
            <img src="${product.image || ''}" class="product-image" loading="lazy" onerror="this.style.display='none'">
            ${discountPercentage}
            ${priceBadgeHtml}
            ${badgesHtml}
        </div>
        <div class="product-content">
            <div class="product-title">${product.title || 'Product'}</div>
            <div class="product-actions">
                <button class="btn-primary" onclick="showProductModal(${index}); event.stopPropagation();">
                    <i class="fas fa-bolt"></i> Quick Buy
                </button>
                <button class="btn-secondary" onclick="addToCart(${index}); event.stopPropagation();">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
    
    cardElement.onclick = (e) => {
        if (!e.target.closest('button')) {
            showProductModal(index);
        }
    };
    
    return cardElement;
}

function filterProducts() {
    const searchTerm = document.getElementById('productsSearch').value.toLowerCase();
    const products = window.appState.card.products || [];
    const allProducts = document.getElementById('allProducts');
    
    allProducts.innerHTML = '';
    
    const filteredProducts = products.filter(product => 
        product.title?.toLowerCase().includes(searchTerm) ||
        product.desc?.toLowerCase().includes(searchTerm) ||
        (product.badges && product.badges.some(badge => badge.toLowerCase().includes(searchTerm)))
    );
    
    filteredProducts.forEach((product, index) => {
        const originalIndex = products.findIndex(p => p.title === product.title);
        allProducts.appendChild(createProductCard(product, originalIndex));
    });
}

function showProductModal(productIndex) {
    const products = window.appState.card.products || [];
    window.appState.currentProduct = products[productIndex];
    
    if (!window.appState.currentProduct) return;
    
    const price = window.appState.currentProduct.discountPrice || window.appState.currentProduct.originalPrice;
    const originalPrice = window.appState.currentProduct.originalPrice && window.appState.currentProduct.discountPrice ? window.appState.currentProduct.originalPrice : null;
    const hasDiscount = originalPrice && price && originalPrice > price;
    
    document.getElementById('modalImage').src = window.appState.currentProduct.image || '';
    document.getElementById('modalTitle').textContent = window.appState.currentProduct.title || 'Product';
    document.getElementById('modalDescription').textContent = window.appState.currentProduct.desc || 'No description available';
    
    const modalPrice = document.getElementById('modalPrice');
    if (hasDiscount) {
        const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
        modalPrice.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                <div style="text-decoration:line-through;color:#94a3b8;font-size:16px;font-weight:500;">PKR ${originalPrice}</div>
                <div style="color:#10b981;font-size:24px;font-weight:900;">PKR ${price}</div>
                <div style="background:var(--danger-gradient);color:white;padding:4px 8px;border-radius:4px;font-size:13px;font-weight:800;">${discount}% OFF</div>
            </div>
        `;
    } else {
        modalPrice.innerHTML = `
            <div style="color:#10b981;font-size:24px;font-weight:900;">PKR ${price || 'N/A'}</div>
        `;
    }
    
    document.getElementById('productDeliveryCalculator').style.display = 'block';
    document.getElementById('directCheckoutSection').style.display = 'none';
    window.checkout.selectBuyNowPayment('whatsapp');
    document.getElementById('buyNowDeliveryCharges').style.display = 'none';
    document.getElementById('buyNowAddressDisplay').textContent = 'Tap to select address';
    
    openModal('productModal');
}

function showDirectCheckout() {
    document.getElementById('directCheckoutSection').style.display = 'block';
    const buyNowDeliveryCharges = document.getElementById('buyNowDeliveryCharges');
    if (buyNowDeliveryCharges) {
        buyNowDeliveryCharges.style.display = 'block';
        window.delivery.calculateDeliveryCharges();
    }
}

function addToCartFromModal() {
    if (window.appState.currentProduct) {
        const products = window.appState.card.products || [];
        const productIndex = products.findIndex(p => p.title === window.appState.currentProduct.title);
        
        if (productIndex !== -1) {
            addToCart(productIndex);
            closeModal('productModal');
        }
    }
}

function loadAboutPage() {
    const aboutContent = document.getElementById('aboutContent');
    const businessHours = document.getElementById('businessHours');
    const holidaysList = document.getElementById('holidaysList');
    
    aboutContent.innerHTML = `<p>${window.appState.card.business?.about || 'No information available'}</p>`;
    
    if (window.appState.card.businessHours && window.appState.card.businessHours.length > 0) {
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        businessHours.innerHTML = '';
        
        window.appState.card.businessHours.forEach((day, index) => {
            if (day) {
                const hourItem = document.createElement('div');
                hourItem.className = 'hour-item';
                
                if (!day.open || day.status === 'closed') {
                    hourItem.innerHTML = `
                        <span class="day-name">${days[index]}</span>
                        <span class="day-time closed">Closed</span>
                    `;
                } else {
                    hourItem.innerHTML = `
                        <span class="day-name">${days[index]}</span>
                        <span class="day-time">${day.start || ''} - ${day.end || ''}</span>
                    `;
                }
                
                businessHours.appendChild(hourItem);
            }
        });
    }
    
    if (window.appState.card.holidays && window.appState.card.holidays.length > 0) {
        holidaysList.innerHTML = '';
        
        window.appState.card.holidays.forEach(holiday => {
            if (holiday.name && holiday.date) {
                const date = new Date(holiday.date);
                const formattedDate = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
                
                const holidayItem = document.createElement('div');
                holidayItem.className = 'hour-item';
                holidayItem.innerHTML = `
                    <span class="day-name">${holiday.name}</span>
                    <span class="day-time">${formattedDate}</span>
                `;
                holidaysList.appendChild(holidayItem);
            }
        });
    }
}

function loadContactPage() {
    const socialGrid = document.getElementById('socialGrid');
    const socialMedia = window.appState.card.socialMedia || {};
    
    socialGrid.innerHTML = '';
    
    const socialPlatforms = [
        { key: 'facebook', icon: 'fab fa-facebook-f', label: 'Facebook', className: 'facebook' },
        { key: 'instagram', icon: 'fab fa-instagram', label: 'Instagram', className: 'instagram' },
        { key: 'twitter', icon: 'fab fa-twitter', label: 'Twitter', className: 'twitter' },
        { key: 'linkedin', icon: 'fab fa-linkedin-in', label: 'LinkedIn', className: 'linkedin' },
        { key: 'youtube', icon: 'fab fa-youtube', label: 'YouTube', className: 'youtube' },
        { key: 'tiktok', icon: 'fab fa-tiktok', label: 'TikTok', className: 'tiktok' }
    ];
    
    socialPlatforms.forEach(platform => {
        const url = socialMedia[platform.key];
        if (url && url.trim()) {
            const socialLink = document.createElement('a');
            socialLink.className = 'social-link';
            socialLink.href = url.includes('://') ? url : `https://${url}`;
            socialLink.target = '_blank';
            socialLink.innerHTML = `
                <div class="social-icon ${platform.className}">
                    <i class="${platform.icon}"></i>
                </div>
                <div class="social-label">${platform.label}</div>
            `;
            socialGrid.appendChild(socialLink);
        }
    });
}

function zoomImage(imageUrl, event) {
    event.stopPropagation();
    
    const overlay = document.getElementById('imageZoomOverlay');
    const zoomedImage = document.getElementById('zoomedImage');
    
    if (imageUrl) {
        zoomedImage.src = imageUrl;
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeImageZoom() {
    const overlay = document.getElementById('imageZoomOverlay');
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

function openWhatsAppChat(context) {
    if (!window.appState.card.phone) {
        window.notifications.showNotification('WhatsApp number not available');
        return;
    }
    
    const phone = window.appState.card.phone.replace(/\D/g, '');
    const businessName = window.appState.card.businessName || window.appState.card.name || "Your Business";
    
    let message = `Hello ${businessName} Team,\n\n`;
    message += `I came across your business and I'm interested in your products/services.\n`;
    message += `Could you please share more information about:\n`;
    message += `1. Current offers/discounts\n`;
    message += `2. Product availability\n`;
    message += `3. Delivery options and charges\n\n`;
    message += `Thank you!`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

function makeCall() {
    if (window.appState.card.phone) {
        window.open(`tel:${window.appState.card.phone}`);
    }
}

function sendEmail() {
    if (window.appState.card.email) {
        const subject = encodeURIComponent(`Inquiry - ${window.appState.card.businessName || 'Business'}`);
        const body = encodeURIComponent(`Hello,\n\nI would like to know more about your products/services.\n\nPlease share more information.\n\nThank you!`);
        window.open(`mailto:${window.appState.card.email}?subject=${subject}&body=${body}`);
    }
}

function openMap() {
    if (window.appState.card.address) {
        window.open(`https://maps.google.com/?q=${encodeURIComponent(window.appState.card.address)}`, '_blank');
    }
}

function updateCustomerPhoneDisplay() {
    const phone = window.utils.getCustomerPhone();
    const displayElement = document.getElementById('customerPhoneDisplay');
    
    if (phone) {
        displayElement.textContent = phone;
        displayElement.style.color = '#10b981';
        displayElement.style.fontWeight = '800';
    } else {
        displayElement.textContent = 'Tap to set your number';
        displayElement.style.color = '';
        displayElement.style.fontWeight = '';
    }
}

// ===== INSTALL PERMISSIONS =====
function showInstallPermissionModal() {
    if (window.isolatedStorage.getItem('installPermissionsShown') === 'true') {
        return;
    }
    
    setTimeout(() => {
        document.getElementById('installPermissionModal').style.display = 'flex';
    }, 3000);
}

function closeInstallPermissionModal() {
    document.getElementById('installPermissionModal').style.display = 'none';
    window.isolatedStorage.setItem('installPermissionsShown', 'true');
}

function acceptInstallPermissions() {
    window.isolatedStorage.setItem('installPermissionsShown', 'true');
    document.getElementById('installPermissionModal').style.display = 'none';
    window.notifications.showNotification('✅ Thank you! Enhancing your experience...');
    
    setTimeout(() => {
        window.businessUtils.saveBusinessToContacts(true);
    }, 1000);
    
    setTimeout(() => {
        window.notifications.enableNotifications();
    }, 2000);
}

// ===== EXIT MODAL =====
function showExitModal() {
    document.getElementById('exitModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeExitModal() {
    document.getElementById('exitModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function exitApp() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
    
    if (window.history.length > 1) {
        window.history.go(-1);
    } else {
        window.close();
    }
}

// Make functions globally available
window.navigateTo = navigateTo;
window.goBack = goBack;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.loadCartPage = loadCartPage;
window.loadProductsPage = loadProductsPage;
window.filterProducts = filterProducts;
window.showProductModal = showProductModal;
window.showDirectCheckout = showDirectCheckout;
window.addToCartFromModal = addToCartFromModal;
window.zoomImage = zoomImage;
window.closeImageZoom = closeImageZoom;
window.openModal = openModal;
window.closeModal = closeModal;
window.openWhatsAppChat = openWhatsAppChat;
window.makeCall = makeCall;
window.sendEmail = sendEmail;
window.openMap = openMap;
window.showExitModal = showExitModal;
window.closeExitModal = closeExitModal;
window.exitApp = exitApp;
window.showInstallPermissionModal = showInstallPermissionModal;
window.closeInstallPermissionModal = closeInstallPermissionModal;
window.acceptInstallPermissions = acceptInstallPermissions;
window.handleProfileImageError = handleProfileImageError;
