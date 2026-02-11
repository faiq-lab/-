// ===== DELIVERY MANAGEMENT SYSTEM =====
window.delivery = {
    // Initialize delivery settings
    initDeliverySettings: function() {
        if (window.appState.card.deliverySettings) {
            window.appState.deliverySettings = {
                deliveryChargeCity: window.appState.card.deliverySettings.deliveryChargeCity || 150,
                deliveryChargeOther: window.appState.card.deliverySettings.deliveryChargeOther || 300,
                deliveryTimeCity: window.appState.card.deliverySettings.deliveryTimeCity || "1-2 days",
                deliveryTimeOther: window.appState.card.deliverySettings.deliveryTimeOther || "3-5 days",
                freeDeliveryMin: window.appState.card.deliverySettings.freeDeliveryMin || 2000
            };
        }
        
        this.updateDeliveryUI();
    },
    
    // Update delivery UI
    updateDeliveryUI: function() {
        document.getElementById('cityDeliveryPrice').textContent = `PKR ${window.appState.deliverySettings.deliveryChargeCity}`;
        document.getElementById('cityDeliveryTime').textContent = window.appState.deliverySettings.deliveryTimeCity;
        document.getElementById('otherDeliveryPrice').textContent = `PKR ${window.appState.deliverySettings.deliveryChargeOther}`;
        document.getElementById('otherDeliveryTime').textContent = window.appState.deliverySettings.deliveryTimeOther;
        document.getElementById('freeDeliveryMinDisplay').textContent = window.appState.deliverySettings.freeDeliveryMin;
        document.getElementById('deliveryTimeDisplay').textContent = window.appState.deliverySettings.deliveryTimeCity;
        
        const productDeliveryEstimate = document.getElementById('productDeliveryEstimate');
        if (productDeliveryEstimate) {
            productDeliveryEstimate.textContent = `PKR ${window.appState.deliverySettings.deliveryChargeCity} - ${window.appState.deliverySettings.deliveryTimeCity}`;
        }
    },
    
    // Show delivery charges modal
    showDeliveryChargesModal: function() {
        const modal = document.getElementById('deliveryChargesModal');
        const optionsContainer = document.getElementById('deliveryOptions');
        
        optionsContainer.innerHTML = `
            <div class="delivery-option ${window.appState.selectedDeliveryOption === 'city' ? 'selected' : ''}" onclick="window.delivery.selectDeliveryOptionModal('city')">
                <i class="fas fa-city"></i>
                <div class="label">Within City</div>
                <div class="price">PKR ${window.appState.deliverySettings.deliveryChargeCity}</div>
                <div class="time">${window.appState.deliverySettings.deliveryTimeCity}</div>
            </div>
            
            <div class="delivery-option ${window.appState.selectedDeliveryOption === 'other' ? 'selected' : ''}" onclick="window.delivery.selectDeliveryOptionModal('other')">
                <i class="fas fa-map-marked-alt"></i>
                <div class="label">Other Cities</div>
                <div class="price">PKR ${window.appState.deliverySettings.deliveryChargeOther}</div>
                <div class="time">${window.appState.deliverySettings.deliveryTimeOther}</div>
            </div>
        `;
        
        this.calculateDeliveryCharges();
        openModal('deliveryChargesModal');
    },
    
    // Select delivery option in modal
    selectDeliveryOptionModal: function(option) {
        window.appState.selectedDeliveryOption = option;
        
        document.querySelectorAll('.delivery-option').forEach(el => {
            el.classList.remove('selected');
        });
        
        if (option === 'city') {
            document.querySelector('.delivery-option:nth-child(1)').classList.add('selected');
        } else {
            document.querySelector('.delivery-option:nth-child(2)').classList.add('selected');
        }
        
        this.calculateDeliveryCharges();
    },
    
    // Select delivery option in checkout
    selectDeliveryOption: function(option) {
        window.appState.selectedDeliveryOption = option;
        
        if (window.appState.currentPage === 'checkoutPage') {
            window.checkout.loadCheckoutPage();
        }
        
        this.calculateDeliveryCharges();
    },
    
    // Calculate delivery charges
    calculateDeliveryCharges: function() {
        const subtotal = window.checkout.getCartSubtotal();
        let charge = 0;
        let deliveryInfo = '';
        
        if (window.appState.selectedDeliveryOption === 'city') {
            charge = window.appState.deliverySettings.deliveryChargeCity;
            deliveryInfo = `Within city - ${window.appState.deliverySettings.deliveryTimeCity}`;
        } else {
            charge = window.appState.deliverySettings.deliveryChargeOther;
            deliveryInfo = `Other cities - ${window.appState.deliverySettings.deliveryTimeOther}`;
        }
        
        const qualifiesForFreeDelivery = subtotal >= window.appState.deliverySettings.freeDeliveryMin;
        if (qualifiesForFreeDelivery) {
            charge = 0;
            deliveryInfo += ' (FREE)';
        }
        
        window.appState.currentDeliveryCharge = charge;
        
        const chargeValue = document.getElementById('deliveryChargeValue');
        const freeMessage = document.getElementById('freeDeliveryMessage');
        
        if (chargeValue) {
            if (qualifiesForFreeDelivery) {
                chargeValue.textContent = 'FREE';
                chargeValue.className = 'delivery-charge-value free';
                freeMessage?.classList.add('show');
            } else {
                chargeValue.textContent = `PKR ${charge}`;
                chargeValue.className = 'delivery-charge-value charge';
                freeMessage?.classList.remove('show');
            }
        }
        
        // Update buy now delivery charges
        const buyNowDeliveryCharge = document.getElementById('buyNowDeliveryCharge');
        const buyNowDeliveryInfo = document.getElementById('buyNowDeliveryInfo');
        
        if (buyNowDeliveryCharge && buyNowDeliveryInfo) {
            if (qualifiesForFreeDelivery) {
                buyNowDeliveryCharge.textContent = 'FREE';
                buyNowDeliveryInfo.textContent = deliveryInfo;
            } else {
                buyNowDeliveryCharge.textContent = `PKR ${charge}`;
                buyNowDeliveryInfo.textContent = deliveryInfo;
            }
        }
        
        return { charge, qualifiesForFreeDelivery, deliveryInfo };
    },
    
    // Apply delivery charges
    applyDeliveryCharges: function() {
        const result = this.calculateDeliveryCharges();
        
        const buyNowDeliveryCharges = document.getElementById('buyNowDeliveryCharges');
        if (buyNowDeliveryCharges) {
            buyNowDeliveryCharges.style.display = 'block';
        }
        
        window.notifications.showNotification(`✅ Delivery charges applied: ${result.qualifiesForFreeDelivery ? 'FREE' : 'PKR ' + result.charge}`);
        closeModal('deliveryChargesModal');
    },
    
    // Get current delivery charge
    getCurrentDeliveryCharge: function() {
        const subtotal = window.checkout.getCartSubtotal();
        const qualifiesForFreeDelivery = subtotal >= window.appState.deliverySettings.freeDeliveryMin;
        
        if (qualifiesForFreeDelivery) {
            return 0;
        }
        
        return window.appState.selectedDeliveryOption === 'city' 
            ? window.appState.deliverySettings.deliveryChargeCity 
            : window.appState.deliverySettings.deliveryChargeOther;
    },
    
    // Calculate delivery charges based on address
    calculateDeliveryChargesBasedOnAddress: function(address) {
        if (!address) {
            return this.calculateDeliveryCharges();
        }
        
        const subtotal = window.checkout.getCartSubtotal();
        let charge = 0;
        let deliveryInfo = '';
        
        const businessCity = window.appState.card.address ? this.extractCity(window.appState.card.address) : '';
        const customerCity = address.city || '';
        
        const cityMatch = businessCity && customerCity && 
                         businessCity.toLowerCase() === customerCity.toLowerCase();
        
        if (cityMatch) {
            charge = window.appState.deliverySettings.deliveryChargeCity;
            deliveryInfo = `Within ${customerCity} - ${window.appState.deliverySettings.deliveryTimeCity}`;
            window.appState.selectedDeliveryOption = 'city';
        } else {
            charge = window.appState.deliverySettings.deliveryChargeOther;
            deliveryInfo = `${customerCity || 'Other city'} - ${window.appState.deliverySettings.deliveryTimeOther}`;
            window.appState.selectedDeliveryOption = 'other';
        }
        
        const qualifiesForFreeDelivery = subtotal >= window.appState.deliverySettings.freeDeliveryMin;
        if (qualifiesForFreeDelivery) {
            charge = 0;
            deliveryInfo += ' (FREE)';
        }
        
        window.appState.currentDeliveryCharge = charge;
        
        return { charge, qualifiesForFreeDelivery, deliveryInfo, cityMatch };
    },
    
    // Extract city from address string
    extractCity: function(address) {
        if (!address) return '';
        const parts = address.split(',');
        return parts[parts.length - 2]?.trim() || '';
    },
    
    // Check for deliveries
    checkForDeliveries: async function() {
        try {
            const customerPhone = window.utils.getCustomerPhone();
            
            if (!customerPhone) {
                console.log('No customer phone found');
                this.updateDeliveryIcon();
                return;
            }
            
            const { data, error } = await window.supabaseClient
                .from('delivery_status')
                .select('*')
                .eq('customer_phone', customerPhone)
                .order('last_updated', { ascending: false });
                
            if (error) {
                console.error('Delivery check error:', error);
                this.updateDeliveryIcon();
                return;
            }
            
            if (data && data.length > 0) {
                const oldDeliveryData = window.appState.deliveryStatusData;
                window.appState.deliveryStatusData = data;
                
                data.forEach(newDelivery => {
                    const oldDelivery = oldDeliveryData.find(d => d.order_id === newDelivery.order_id);
                    
                    if (!oldDelivery) {
                        this.addDeliveryNotification(newDelivery);
                    } else if (oldDelivery.status !== newDelivery.status) {
                        this.addDeliveryNotification(newDelivery);
                    }
                });
                
                this.updateDeliveryIcon();
            } else {
                window.appState.deliveryStatusData = [];
                this.updateDeliveryIcon();
            }
        } catch (err) {
            console.log('Delivery check failed:', err);
            this.updateDeliveryIcon();
        }
    },
    
    // Update delivery icon
    updateDeliveryIcon: function() {
        const icon = document.getElementById('deliveryIcon');
        const badge = document.getElementById('deliveryBadge');
        
        if (window.appState.deliveryStatusData.length > 0) {
            icon.style.color = '#10b981';
            badge.textContent = window.appState.deliveryStatusData.length;
            badge.style.display = 'flex';
            
            const hasPending = window.appState.deliveryStatusData.some(order => order.status === 'pending');
            if (hasPending) {
                badge.classList.add('alert');
            } else {
                badge.classList.remove('alert');
            }
        } else {
            icon.style.color = 'white';
            badge.style.display = 'none';
            badge.classList.remove('alert');
        }
    },
    
    // Check delivery status
    checkDeliveryStatus: function() {
        const customerPhone = window.utils.getCustomerPhone();
        
        if (!customerPhone) {
            this.openPhoneInput();
            window.notifications.showNotification('Please add your phone number to track deliveries');
            return;
        }
        
        navigateTo('deliveryPage');
    },
    
    // Load delivery status
    loadDeliveryStatus: async function() {
        const phone = window.utils.getCustomerPhone();
        
        if (!phone) {
            document.getElementById('deliveryContent').innerHTML = `
                <div class="no-deliveries">
                    <i class="fas fa-phone"></i>
                    <h3>Phone Number Needed</h3>
                    <p>Please save your phone number to track deliveries.</p>
                    <button onclick="window.delivery.openPhoneInput()" style="padding:12px 30px;background:var(--primary-gradient);color:white;border:none;border-radius:12px;font-weight:700;cursor:pointer;">
                        Add Phone Number
                    </button>
                </div>
            `;
            return;
        }
        
        const { data, error } = await window.supabaseClient
            .from('delivery_status')
            .select('*')
            .eq('customer_phone', phone)
            .order('last_updated', { ascending: false });
            
        if (error || !data || data.length === 0) {
            document.getElementById('deliveryContent').innerHTML = `
                <div class="no-deliveries">
                    <i class="fas fa-truck" style="color:#10b981;"></i>
                    <h3>No Active Deliveries</h3>
                    <p>Your delivery status will appear here once you place an order.</p>
                    <button onclick="navigateTo('productsPage')" style="padding:12px 30px;background:var(--primary-gradient);color:white;border:none;border-radius:12px;font-weight:700;cursor:pointer;">
                        <i class="fas fa-shopping-bag"></i> Shop Now
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        data.forEach(order => {
            const statusClass = order.status;
            const statusText = order.status.charAt(0).toUpperCase() + order.status.slice(1);
            const updatedTime = new Date(order.last_updated).toLocaleString();
            
            html += `
                <div class="delivery-card ${statusClass}">
                    <div class="delivery-header">
                        <div class="delivery-order-id">Order #${order.order_id}</div>
                        <div class="delivery-status ${statusClass}">${statusText}</div>
                    </div>
                    
                    <div class="delivery-info">
                        <i class="fas fa-user"></i>
                        <span>${order.customer_name || 'Customer'}</span>
                    </div>
                    
                    ${order.location ? `
                        <div class="delivery-info">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${order.location}</span>
                        </div>
                    ` : ''}
                    
                    ${order.delivery_person ? `
                        <div class="delivery-info">
                            <i class="fas fa-user-tag"></i>
                            <span>${order.delivery_person}</span>
                        </div>
                    ` : ''}
                    
                    <div class="delivery-timestamp">
                        <i class="fas fa-clock"></i>
                        <span>Updated: ${updatedTime}</span>
                    </div>
                </div>
            `;
        });
        
        document.getElementById('deliveryContent').innerHTML = html;
    },
    
    // Open phone input
    openPhoneInput: function() {
        const currentPhone = window.utils.getCustomerPhone();
        const phone = prompt("Enter your phone number for delivery tracking:", currentPhone || "");
        
        if (phone) {
            const cleanedPhone = phone.replace(/\D/g, '');
            if (cleanedPhone.length >= 10) {
                window.utils.saveCustomerPhone(cleanedPhone);
                updateCustomerPhoneDisplay();
                window.notifications.showNotification('✅ Phone number saved successfully!');
                window.notifications.addInnerNotification('Phone Number Saved', 'Your phone number has been saved for delivery tracking', 'success');
                
                this.checkForDeliveries();
                
                if (window.appState.currentPage === 'deliveryPage') {
                    this.loadDeliveryStatus();
                }
            } else {
                window.notifications.showNotification('❌ Please enter a valid phone number');
            }
        }
    },
    
    // Add delivery notification
    addDeliveryNotification: function(delivery) {
        const statusText = delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1);
        const title = `Delivery ${statusText}`;
        const message = `Order #${delivery.order_id} is now ${delivery.status}`;
        
        let type = 'info';
        switch(delivery.status) {
            case 'delivered': type = 'success'; break;
            case 'cancelled': type = 'error'; break;
            case 'pending': type = 'warning'; break;
            case 'shipped': type = 'delivery'; break;
        }
        
        window.notifications.addInnerNotification(title, message, type);
    }
};
