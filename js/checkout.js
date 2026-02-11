// ===== CHECKOUT SYSTEM =====
window.checkout = {
    // Start checkout process
    startCheckout: function() {
        if (window.appState.cart.length === 0) {
            window.notifications.showNotification('Your cart is empty');
            return;
        }
        
        // Check if address is selected
        const selectedAddress = window.address.getSelectedAddress();
        if (!selectedAddress) {
            window.notifications.showNotification('Please select a delivery address first');
            window.address.selectAddressForCheckout();
            return;
        }
        
        navigateTo('checkoutPage');
        this.loadCheckoutPage();
    },
    
    // Load checkout page
    loadCheckoutPage: function() {
        const container = document.getElementById('checkout-container');
        
        if (!container) return;
        
        const selectedAddress = window.address.getSelectedAddress();
        const subtotal = this.getCartSubtotal();
        
        let html = `
            <div class="glass-card">
                <div class="step-indicator">
                    <div class="step active" data-step="1">
                        <span>1</span>
                        <div class="step-label">Cart</div>
                    </div>
                    <div class="step" data-step="2">
                        <span>2</span>
                        <div class="step-label">Address</div>
                    </div>
                    <div class="step" data-step="3">
                        <span>3</span>
                        <div class="step-label">Delivery</div>
                    </div>
                    <div class="step" data-step="4">
                        <span>4</span>
                        <div class="step-label">Payment</div>
                    </div>
                    <div class="step" data-step="5">
                        <span>5</span>
                        <div class="step-label">Confirm</div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-lg-8">
                    <!-- Address Section -->
                    <div class="glass-card">
                        <h3 class="mb-4 fw-800">
                            <i class="fas fa-map-marker-alt text-primary me-2"></i>
                            Delivery Address
                        </h3>
                        
                        <div id="checkout-address-section">
        `;
        
        if (selectedAddress) {
            html += `
                <div class="address-card ${selectedAddress.type}" style="margin:0;margin-bottom:20px;">
                    <div class="address-type ${selectedAddress.type}">${selectedAddress.type.charAt(0).toUpperCase() + selectedAddress.type.slice(1)}</div>
                    <div class="address-header">
                        <div class="address-icon ${selectedAddress.type}">
                            <i class="fas ${selectedAddress.type === 'home' ? 'fa-home' : selectedAddress.type === 'work' ? 'fa-briefcase' : 'fa-map-pin'}"></i>
                        </div>
                        <div class="address-name">${selectedAddress.fullName}</div>
                    </div>
                    <div class="address-details">
                        ${selectedAddress.addressLine1}<br>
                        ${selectedAddress.addressLine2 ? selectedAddress.addressLine2 + '<br>' : ''}
                        ${selectedAddress.city}, ${selectedAddress.state}<br>
                        ${selectedAddress.postalCode} ${selectedAddress.country}
                    </div>
                    <div class="address-phone">
                        <i class="fas fa-phone"></i>
                        <span>${selectedAddress.phone}</span>
                    </div>
                    <div style="margin-top:15px;">
                        <button class="btn btn-outline-primary btn-sm" onclick="window.address.selectAddressForCheckout()">
                            <i class="fas fa-edit"></i> Change Address
                        </button>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div style="text-align:center; padding:20px;">
                    <p>No address selected</p>
                    <button class="btn-gradient" onclick="window.address.selectAddressForCheckout()">
                        <i class="fas fa-plus"></i> Select Delivery Address
                    </button>
                </div>
            `;
        }
        
        html += `
                        </div>
                    </div>
                    
                    <!-- Delivery Options -->
                    <div class="glass-card">
                        <h3 class="mb-4 fw-800">
                            <i class="fas fa-shipping-fast text-primary me-2"></i>
                            Delivery Options
                        </h3>
                        
                        <div class="delivery-options" style="display:flex;flex-direction:column;gap:15px;">
                            <div class="delivery-option ${window.appState.selectedDeliveryOption === 'city' ? 'selected' : ''}" onclick="window.delivery.selectDeliveryOption('city')">
                                <div class="form-check mb-0">
                                    <input class="form-check-input" type="radio" name="deliveryOption" id="delivery-city" ${window.appState.selectedDeliveryOption === 'city' ? 'checked' : ''}>
                                    <label class="form-check-label w-100" for="delivery-city">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>Within City</strong>
                                                <p class="mb-0 text-muted">${window.appState.deliverySettings.deliveryTimeCity}</p>
                                            </div>
                                            <div>
                                                <strong>PKR ${window.appState.deliverySettings.deliveryChargeCity}</strong>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="delivery-option ${window.appState.selectedDeliveryOption === 'other' ? 'selected' : ''}" onclick="window.delivery.selectDeliveryOption('other')">
                                <div class="form-check mb-0">
                                    <input class="form-check-input" type="radio" name="deliveryOption" id="delivery-other" ${window.appState.selectedDeliveryOption === 'other' ? 'checked' : ''}>
                                    <label class="form-check-label w-100" for="delivery-other">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>Other Cities</strong>
                                                <p class="mb-0 text-muted">${window.appState.deliverySettings.deliveryTimeOther}</p>
                                            </div>
                                            <div>
                                                <strong>PKR ${window.appState.deliverySettings.deliveryChargeOther}</strong>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div id="checkout-delivery-message" class="delivery-free-message ${subtotal >= window.appState.deliverySettings.freeDeliveryMin ? 'show' : ''}" style="margin-top:20px;">
                            <i class="fas fa-gift"></i> Congratulations! You qualify for FREE delivery!
                        </div>
                    </div>
                    
                    <!-- Payment Methods -->
                    <div class="glass-card">
                        <h3 class="mb-4 fw-800">
                            <i class="fas fa-credit-card text-primary me-2"></i>
                            Payment Method
                        </h3>
                        
                        <div class="payment-method ${window.appState.checkoutPaymentMethod === 'whatsapp' ? 'selected' : ''}" onclick="window.checkout.selectCheckoutPayment('whatsapp')">
                            <div class="form-check mb-0">
                                <input class="form-check-input" type="radio" name="paymentMethod" id="payment-whatsapp" ${window.appState.checkoutPaymentMethod === 'whatsapp' ? 'checked' : ''}>
                                <label class="form-check-label w-100" for="payment-whatsapp">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong><i class="fab fa-whatsapp me-2"></i>WhatsApp Order</strong>
                                            <p class="mb-0 text-muted">Confirm via WhatsApp</p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <div class="payment-method ${window.appState.checkoutPaymentMethod === 'cod' ? 'selected' : ''}" onclick="window.checkout.selectCheckoutPayment('cod')">
                            <div class="form-check mb-0">
                                <input class="form-check-input" type="radio" name="paymentMethod" id="payment-cod" ${window.appState.checkoutPaymentMethod === 'cod' ? 'checked' : ''}>
                                <label class="form-check-label w-100" for="payment-cod">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong><i class="fas fa-truck me-2"></i>Cash on Delivery</strong>
                                            <p class="mb-0 text-muted">Pay when arrives</p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <div class="payment-method ${window.appState.checkoutPaymentMethod === 'jazzcash' ? 'selected' : ''}" onclick="window.checkout.selectCheckoutPayment('jazzcash')">
                            <div class="form-check mb-0">
                                <input class="form-check-input" type="radio" name="paymentMethod" id="payment-jazzcash" ${window.appState.checkoutPaymentMethod === 'jazzcash' ? 'checked' : ''}>
                                <label class="form-check-label w-100" for="payment-jazzcash">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong><i class="fas fa-qrcode me-2"></i>JazzCash / EasyPaisa</strong>
                                            <p class="mb-0 text-muted">Pay via QR Code</p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between mt-4">
                        <button class="btn btn-outline-secondary" onclick="navigateTo('cartPage')">
                            <i class="fas fa-arrow-left me-2"></i> Back to Cart
                        </button>
                        <button class="btn-success-gradient" onclick="window.checkout.processCheckout()">
                            <i class="fas fa-lock me-2"></i> Complete Order
                        </button>
                    </div>
                </div>
                
                <div class="col-lg-4">
                    <div class="order-summary-card">
                        <h4 class="fw-800 mb-3">
                            <i class="fas fa-clipboard-list text-primary me-2"></i>
                            Order Summary
                        </h4>
                        
                        <div id="checkout-order-items">
        `;
        
        // Add cart items
        window.appState.cart.forEach(item => {
            const price = parseFloat(item.discountPrice || item.originalPrice || 0);
            const itemTotal = price * (item.quantity || 1);
            html += `
                <div class="summary-item">
                    <span>${item.title || 'Product'} x${item.quantity || 1}</span>
                    <span>PKR ${itemTotal.toFixed(2)}</span>
                </div>
            `;
        });
        
        const subtotalAmount = this.getCartSubtotal();
        const deliveryCharge = window.delivery.getCurrentDeliveryCharge();
        const totalAmount = subtotalAmount + deliveryCharge;
        
        html += `
                        </div>
                        
                        <div class="summary-item">
                            <span>Subtotal:</span>
                            <span>PKR ${subtotalAmount.toFixed(2)}</span>
                        </div>
                        
                        <div class="summary-item">
                            <span>Shipping:</span>
                            <span id="checkout-shipping">PKR ${deliveryCharge.toFixed(2)}</span>
                        </div>
                        
                        <div class="summary-item summary-total">
                            <span>Total:</span>
                            <span class="text-success fw-800">PKR ${totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // Process checkout
    processCheckout: function() {
        const selectedAddress = window.address.getSelectedAddress();
        if (!selectedAddress) {
            window.notifications.showNotification('❌ Please select a delivery address');
            window.address.selectAddressForCheckout();
            return;
        }
        
        const subtotal = this.getCartSubtotal();
        const deliveryResult = window.delivery.calculateDeliveryChargesBasedOnAddress(selectedAddress);
        const totalAmount = subtotal + deliveryResult.charge;
        
        if (window.appState.checkoutPaymentMethod === 'jazzcash' && window.appState.card.payments?.jazzcash?.active) {
            this.showPaymentDetailsModal('checkout', totalAmount, selectedAddress, deliveryResult);
        } else {
            this.sendCheckoutOrder(totalAmount, deliveryResult, selectedAddress);
        }
    },
    
    // Send checkout order
    sendCheckoutOrder: function(totalAmount, deliveryResult, selectedAddress) {
        if (window.appState.cart.length === 0 || !selectedAddress) return;
        
        const businessName = window.appState.card.businessName || window.appState.card.name || "Your Business";
        
        let message = `Hello ${businessName} Team,\n\n`;
        message += `I would like to place an order:\n\n`;
        message += `🛒 **Order Details:**\n`;
        
        window.appState.cart.forEach((item, index) => {
            const price = parseFloat(item.discountPrice || item.originalPrice || 0);
            const total = price * (item.quantity || 1);
            message += `${index + 1}. ${item.title || 'Product'} - Qty: ${item.quantity || 1} - PKR ${total.toFixed(2)}\n`;
        });
        
        const subtotal = this.getCartSubtotal();
        
        message += `\n---\n`;
        message += `💰 **Subtotal:** PKR ${subtotal.toFixed(2)}\n`;
        
        if (deliveryResult.charge > 0) {
            message += `🚚 **Shipping:** PKR ${deliveryResult.charge}\n`;
        } else {
            message += `🎁 **Shipping:** FREE (Order above PKR ${window.appState.deliverySettings.freeDeliveryMin})\n`;
        }
        
        message += `🎯 **Total:** PKR ${totalAmount.toFixed(2)}\n\n`;
        message += `💳 **Payment Method:** ${this.getPaymentMethodName(window.appState.checkoutPaymentMethod)}\n`;
        message += `📍 **Delivery Area:** ${deliveryResult.cityMatch ? 'Within City' : 'Other Cities'}\n`;
        message += `⏱️ **Estimated Delivery:** ${deliveryResult.deliveryInfo}\n\n`;
        
        // Add address
        message += window.address.formatAddressForWhatsApp(selectedAddress);
        
        if (window.appState.checkoutPaymentMethod === 'jazzcash' && window.appState.card.payments?.jazzcash?.active) {
            message += `\n\n📱 **Payment Details:** Amount sent to ${window.appState.card.payments.jazzcash.number || ''}\n`;
            message += `💸 **Via:** ${window.appState.card.payments.jazzcash.type === 'easypaisa' ? 'EasyPaisa' : 'JazzCash'}`;
        } else if (window.appState.checkoutPaymentMethod === 'cod') {
            message += `\n\n📦 **Delivery:** I prefer Cash on Delivery`;
        }
        
        message += `\n\nPlease confirm all items are available and share estimated delivery time.\n`;
        message += `Thank you!\n`;
        
        if (window.appState.card.phone) {
            const phone = window.appState.card.phone.replace(/\D/g, '');
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        }
        
        // Add notification
        window.notifications.addInnerNotification('Order Placed', `Order placed for ${window.appState.cart.length} items (Total: PKR ${totalAmount.toFixed(2)})`, 'success');
        
        // Clear cart
        window.appState.cart = [];
        updateCartCount();
        
        // Navigate to confirmation
        this.showConfirmation(totalAmount, selectedAddress, deliveryResult);
    },
    
    // Show order confirmation
    showConfirmation: function(totalAmount, selectedAddress, deliveryResult) {
        const confirmationContainer = document.getElementById('confirmation-container');
        
        const orderNumber = 'ORD-' + Date.now().toString().slice(-8);
        const trackingNumber = 'TRK-' + Math.random().toString(36).substr(2, 10).toUpperCase();
        
        const estimatedDate = new Date();
        const deliveryDays = {
            'city': 2,
            'other': 5
        };
        estimatedDate.setDate(estimatedDate.getDate() + (deliveryDays[window.appState.selectedDeliveryOption] || 3));
        
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const estimatedDelivery = estimatedDate.toLocaleDateString('en-US', options);
        
        confirmationContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="mb-4">
                    <i class="fas fa-check-circle fa-5x text-success"></i>
                </div>
                <h2 class="text-success fw-800">Order Confirmed!</h2>
                <p class="lead">Your Order Number: <strong class="text-dark">${orderNumber}</strong></p>
                
                <div class="card mx-auto mt-4 border-0 shadow-sm" style="max-width: 600px;">
                    <div class="card-body">
                        <h5 class="card-title fw-700">
                            <i class="fas fa-receipt text-primary me-2"></i>
                            Order Details
                        </h5>
                        <div class="text-start">
                            <div class="summary-item">
                                <span>Address:</span>
                                <span class="fw-600">${selectedAddress.addressLine1}, ${selectedAddress.city}</span>
                            </div>
                            <div class="summary-item">
                                <span>Delivery:</span>
                                <span class="fw-600">${deliveryResult.deliveryInfo}</span>
                            </div>
                            <div class="summary-item">
                                <span>Payment:</span>
                                <span class="fw-600">${this.getPaymentMethodName(window.appState.checkoutPaymentMethod)}</span>
                            </div>
                            <div class="summary-item">
                                <span>Total Amount:</span>
                                <span class="fw-600">PKR ${totalAmount.toFixed(2)}</span>
                            </div>
                            <div class="summary-item">
                                <span>Estimated Delivery:</span>
                                <span class="fw-600">${estimatedDelivery}</span>
                            </div>
                            <div class="summary-item">
                                <span>Tracking Number:</span>
                                <span class="fw-600 text-primary">${trackingNumber}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-4">
                    <p class="text-muted">
                        We'll send you order updates via WhatsApp and SMS.
                    </p>
                    <div class="d-flex justify-content-center gap-3 mt-4 flex-wrap">
                        <a href="index.html" class="btn btn-success-gradient">
                            <i class="fas fa-home me-2"></i> Return to Home
                        </a>
                        <button class="btn btn-outline-primary" onclick="navigateTo('deliveryPage')">
                            <i class="fas fa-shipping-fast me-2"></i> Track Order
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        navigateTo('confirmationPage');
    },
    
    // Select payment method for checkout
    selectCheckoutPayment: function(method) {
        window.appState.checkoutPaymentMethod = method;
        this.loadCheckoutPage();
    },
    
    // Select payment method for buy now
    selectBuyNowPayment: function(method) {
        window.appState.buyNowPaymentMethod = method;
        
        const whatsappOption = document.getElementById('whatsappBuyNowOption');
        const codOption = document.getElementById('codBuyNowOption');
        const jazzcashOption = document.getElementById('jazzcashBuyNowOption');
        
        [whatsappOption, codOption, jazzcashOption].forEach(option => {
            if (option) {
                option.style.borderColor = '#e2e8f0';
            }
        });
        
        if (method === 'whatsapp' && whatsappOption) {
            whatsappOption.style.borderColor = '#25D366';
        } else if (method === 'cod' && codOption) {
            codOption.style.borderColor = '#10b981';
        } else if (method === 'jazzcash' && jazzcashOption) {
            jazzcashOption.style.borderColor = '#FF6B00';
        }
    },
    
    // Checkout buy now (single product)
    checkoutBuyNow: function() {
        if (!window.appState.currentProduct) return;
        
        const selectedAddress = window.address.getSelectedAddress();
        if (!selectedAddress) {
            window.notifications.showNotification('❌ Please select a delivery address');
            window.address.selectAddressForBuyNow();
            return;
        }
        
        const deliveryResult = window.delivery.calculateDeliveryChargesBasedOnAddress(selectedAddress);
        const productPrice = parseFloat(window.appState.currentProduct.discountPrice || window.appState.currentProduct.originalPrice || 0);
        const totalAmount = productPrice + deliveryResult.charge;
        
        if (window.appState.buyNowPaymentMethod === 'jazzcash' && window.appState.card.payments?.jazzcash?.active) {
            this.showPaymentDetailsModal('buyNow', totalAmount, selectedAddress, deliveryResult);
        } else {
            this.sendBuyNowOrder(totalAmount, deliveryResult, selectedAddress);
        }
    },
    
    // Send buy now order
    sendBuyNowOrder: function(totalAmount, deliveryResult, selectedAddress) {
        if (!window.appState.currentProduct || !selectedAddress) return;
        
        const price = window.appState.currentProduct.discountPrice || window.appState.currentProduct.originalPrice || 0;
        const businessName = window.appState.card.businessName || window.appState.card.name || "Your Business";
        
        let message = `Hello ${businessName} Team,\n\n`;
        message += `I would like to place an order for the following product:\n\n`;
        message += `🛒 **Product:** ${window.appState.currentProduct.title || 'Product'}\n`;
        message += `💰 **Product Price:** PKR ${price}\n`;
        
        if (deliveryResult.charge > 0) {
            message += `🚚 **Delivery Charges:** PKR ${deliveryResult.charge}\n`;
        } else {
            message += `🎁 **Delivery:** FREE (Order above PKR ${window.appState.deliverySettings.freeDeliveryMin})\n`;
        }
        
        message += `🎯 **Total Amount:** PKR ${totalAmount}\n`;
        
        if (window.appState.currentProduct.desc) {
            message += `📝 **Description:** ${window.appState.currentProduct.desc}\n`;
        }
        
        message += `\n---\n`;
        message += `💳 **Payment Method:** ${this.getPaymentMethodName(window.appState.buyNowPaymentMethod)}\n`;
        message += `📍 **Delivery Area:** ${deliveryResult.cityMatch ? 'Within City' : 'Other Cities'}\n`;
        message += `⏱️ **Estimated Delivery:** ${deliveryResult.deliveryInfo}\n\n`;
        
        message += window.address.formatAddressForWhatsApp(selectedAddress);
        
        if (window.appState.buyNowPaymentMethod === 'jazzcash' && window.appState.card.payments?.jazzcash?.active) {
            message += `\n\n📱 **Payment Details:** Amount sent to ${window.appState.card.payments.jazzcash.number || ''}\n`;
            message += `💸 **Via:** ${window.appState.card.payments.jazzcash.type === 'easypaisa' ? 'EasyPaisa' : 'JazzCash'}`;
        } else if (window.appState.buyNowPaymentMethod === 'cod') {
            message += `\n\n📦 **Delivery:** I prefer Cash on Delivery`;
        }
        
        message += `\n\nPlease confirm product availability and share estimated delivery time.\n`;
        message += `Thank you!\n`;
        
        if (window.appState.card.phone) {
            const phone = window.appState.card.phone.replace(/\D/g, '');
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        }
        
        window.notifications.addInnerNotification('Order Placed', `Order placed for ${window.appState.currentProduct.title} (Total: PKR ${totalAmount})`, 'success');
        
        closeModal('productModal');
    },
    
    // Show payment details modal
    showPaymentDetailsModal: function(context, totalAmount, selectedAddress, deliveryResult) {
        const paymentMethodTitle = document.getElementById('paymentMethodTitle');
        const paymentDetailsContent = document.getElementById('paymentDetailsContent');
        const businessName = window.appState.card.businessName || window.appState.card.name || "Your Business";
        
        if (context === 'buyNow' && window.appState.currentProduct) {
            paymentMethodTitle.innerHTML = `JazzCash Payment`;
            
            paymentDetailsContent.innerHTML = `
                <div style="text-align:center;">
                    <div style="margin-bottom:20px;">
                        <div style="font-size:15px;color:#64748b;margin-bottom:12px;">Send <strong style="color:#10b981;font-size:20px;">PKR ${totalAmount}</strong> to:</div>
                        <div style="font-size:24px;font-weight:900;color:#FF6B00;margin:15px 0;background:rgba(255,107,0,0.1);padding:15px;border-radius:16px;">
                            ${window.appState.card.payments?.jazzcash?.number || ''}
                        </div>
                        <div style="font-size:13px;color:#64748b;margin-top:10px;">For: ${window.appState.currentProduct.title || 'Product'}</div>
                    </div>
                    
                    ${window.appState.card.payments?.jazzcash?.barcode ? `
                        <div style="margin:20px 0;text-align:center;">
                            <div style="font-size:14px;color:#64748b;margin-bottom:12px;font-weight:700;">Scan QR Code to Pay</div>
                            <img src="${window.appState.card.payments.jazzcash.barcode}" style="max-width:200px;max-height:200px;border-radius:16px;border:2px solid #e2e8f0;display:block;margin:0 auto;background:white;padding:12px;">
                        </div>
                    ` : ''}
                    
                    <div style="background:#f0f9ff;padding:15px;border-radius:16px;margin-top:20px;">
                        <div style="font-size:14px;color:#64748b;margin-bottom:10px;font-weight:800;">Order Summary:</div>
                        <div style="text-align:left;color:#475569;line-height:1.6;">
                            <div>Product: ${window.appState.currentProduct.title}</div>
                            <div>Amount: PKR ${totalAmount}</div>
                            <div>Delivery: ${deliveryResult.deliveryInfo}</div>
                            <div style="margin-top:10px;color:#10b981;font-weight:700;">Address: ${selectedAddress.addressLine1}, ${selectedAddress.city}</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (context === 'checkout') {
            paymentMethodTitle.innerHTML = `JazzCash Payment`;
            
            paymentDetailsContent.innerHTML = `
                <div style="text-align:center;">
                    <div style="margin-bottom:20px;">
                        <div style="font-size:15px;color:#64748b;margin-bottom:12px;">Send <strong style="color:#10b981;font-size:20px;">PKR ${totalAmount.toFixed(2)}</strong> to:</div>
                        <div style="font-size:24px;font-weight:900;color:#FF6B00;margin:15px 0;background:rgba(255,107,0,0.1);padding:15px;border-radius:16px;">
                            ${window.appState.card.payments?.jazzcash?.number || ''}
                        </div>
                        <div style="font-size:13px;color:#64748b;margin-top:10px;">For: ${businessName} - Order (${window.appState.cart.length} items)</div>
                    </div>
                    
                    ${window.appState.card.payments?.jazzcash?.barcode ? `
                        <div style="margin:20px 0;text-align:center;">
                            <div style="font-size:14px;color:#64748b;margin-bottom:12px;font-weight:700;">Scan QR Code to Pay</div>
                            <img src="${window.appState.card.payments.jazzcash.barcode}" style="max-width:200px;max-height:200px;border-radius:16px;border:2px solid #e2e8f0;display:block;margin:0 auto;background:white;padding:12px;">
                        </div>
                    ` : ''}
                    
                    <div style="background:#f0f9ff;padding:15px;border-radius:16px;margin-top:20px;">
                        <div style="font-size:14px;color:#64748b;margin-bottom:10px;font-weight:800;">Order Summary:</div>
                        <div style="text-align:left;color:#475569;line-height:1.6;">
                            <div>Items: ${window.appState.cart.length} products</div>
                            <div>Amount: PKR ${totalAmount.toFixed(2)}</div>
                            <div>Delivery: ${deliveryResult.deliveryInfo}</div>
                            <div style="margin-top:10px;color:#10b981;font-weight:700;">Address: ${selectedAddress.addressLine1}, ${selectedAddress.city}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        openModal('paymentDetailsModal');
        closeModal(context === 'buyNow' ? 'productModal' : 'checkoutModal');
    },
    
    // Confirm payment
    confirmPayment: function() {
        const selectedAddress = window.address.getSelectedAddress();
        if (!selectedAddress) {
            window.notifications.showNotification('Address not found');
            return;
        }
        
        const subtotal = this.getCartSubtotal();
        const deliveryResult = window.delivery.calculateDeliveryChargesBasedOnAddress(selectedAddress);
        const totalAmount = subtotal + deliveryResult.charge;
        
        if (window.appState.currentPage === 'checkoutModal' || window.appState.checkoutPaymentMethod === 'jazzcash') {
            this.sendCheckoutOrder(totalAmount, deliveryResult, selectedAddress);
        } else {
            this.sendBuyNowOrder(totalAmount, deliveryResult, selectedAddress);
        }
        closeModal('paymentDetailsModal');
    },
    
    // Get cart subtotal
    getCartSubtotal: function() {
        return window.appState.cart.reduce((sum, item) => {
            const price = parseFloat(item.discountPrice || item.originalPrice || 0);
            return sum + (price * (item.quantity || 1));
        }, 0);
    },
    
    // Get payment method name
    getPaymentMethodName: function(method) {
        switch(method) {
            case 'whatsapp': return 'WhatsApp Order';
            case 'cod': return 'Cash on Delivery';
            case 'jazzcash': return window.appState.card.payments?.jazzcash?.type === 'easypaisa' ? 'EasyPaisa' : 'JazzCash';
            default: return 'WhatsApp Order';
        }
    }
};
