// ===== SUPABASE CONFIGURATION =====
const SUPABASE_CONFIG = {
    url: "https://dfvnefbxgayxqgjjgtrr.supabase.co",
    key: "sb_publishable_WypeFELCIlVDlqGY4PdWwA_snqoPUSE"
};

// ===== GLOBAL VARIABLES =====
window.appState = {
    // Business Data
    card: {},
    currentBusinessId: '',
    shortCardId: '',
    
    // User Data
    cart: [],
    addresses: [],
    selectedAddressId: null,
    deliveryStatusData: [],
    
    // Auth
    isAdminLoggedIn: false,
    businessAdminPassword: "",
    
    // UI State
    currentPage: 'loadingScreen',
    notificationPermission: false,
    innerNotifications: [],
    unreadNotifications: 0,
    
    // Delivery Settings
    deliverySettings: {
        deliveryChargeCity: 150,
        deliveryChargeOther: 300,
        deliveryTimeCity: "1-2 days",
        deliveryTimeOther: "3-5 days",
        freeDeliveryMin: 2000
    },
    
    // Checkout State
    selectedDeliveryOption: 'city',
    currentDeliveryCharge: 0,
    checkoutPaymentMethod: 'whatsapp',
    buyNowPaymentMethod: 'whatsapp',
    currentProduct: null,
    
    // Address State
    currentAddressType: 'home',
    currentLocation: null,
    editingAddressId: null,
    isSelectingAddressForCheckout: false,
    
    // Customer Data
    customerData: {
        deviceId: '',
        phone: '',
        name: '',
        email: '',
        installDate: '',
        lastActive: '',
        permissions: {}
    }
};

// ===== STORAGE KEYS =====
window.STORAGE_KEYS = {
    CART: 'cart',
    ADDRESSES: 'addresses',
    ADMIN_LOGIN: 'isAdminLoggedIn',
    CUSTOMER_PHONE: 'customerPhone',
    BUSINESS_PHONE: 'businessPhone',
    NOTIFICATIONS: 'innerNotifications',
    INSTALL_PERMISSIONS: 'installPermissionsShown',
    CUSTOMER_NAME: 'customerName',
    CUSTOMER_EMAIL: 'customerEmail'
};

// ===== SUPABASE CLIENT =====
window.supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
