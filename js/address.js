// ===== ADDRESS MANAGEMENT SYSTEM =====
window.address = {
    // Initialize address system
    initAddressSystem: function() {
        this.loadAddresses();
        this.updateDefaultAddressSummary();
    },
    
    // Load addresses from isolated storage
    loadAddresses: function() {
        const savedAddresses = window.isolatedStorage.getItem('addresses');
        window.appState.addresses = savedAddresses ? JSON.parse(savedAddresses) : [];
        
        // If no addresses, create a default one if customer phone exists
        if (window.appState.addresses.length === 0) {
            const customerPhone = window.utils.getCustomerPhone();
            if (customerPhone) {
                const defaultAddress = {
                    id: window.utils.generateId(),
                    type: 'home',
                    fullName: 'Your Name',
                    phone: customerPhone,
                    addressLine1: 'Your Address',
                    addressLine2: '',
                    city: 'Your City',
                    state: 'Your State',
                    postalCode: '',
                    country: 'Pakistan',
                    isDefault: true,
                    instructions: ''
                };
                window.appState.addresses.push(defaultAddress);
                this.saveAddresses();
            }
        }
        
        return window.appState.addresses;
    },
    
    // Save addresses to isolated storage
    saveAddresses: function() {
        window.isolatedStorage.setItem('addresses', JSON.stringify(window.appState.addresses));
    },
    
    // Select address type in form
    selectAddressType: function(type) {
        window.appState.currentAddressType = type;
        
        document.querySelectorAll('.type-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        document.querySelector(`.type-option.${type}`).classList.add('selected');
    },
    
    // Show address form modal
    showAddressFormModal: function(forCheckout = false) {
        window.appState.editingAddressId = null;
        window.appState.isSelectingAddressForCheckout = forCheckout;
        
        // Reset form
        document.getElementById('addressFormTitle').textContent = 'Add New Address';
        document.getElementById('addressId').value = '';
        document.getElementById('addressFullName').value = '';
        document.getElementById('addressPhone').value = window.utils.getCustomerPhone() || '';
        document.getElementById('addressLine1').value = '';
        document.getElementById('addressLine2').value = '';
        document.getElementById('addressCity').value = '';
        document.getElementById('addressState').value = '';
        document.getElementById('addressPostalCode').value = '';
        document.getElementById('addressCountry').value = 'Pakistan';
        document.getElementById('addressInstructions').value = '';
        document.getElementById('setAsDefault').checked = true;
        
        // Reset type selection
        window.appState.currentAddressType = 'home';
        document.querySelectorAll('.type-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector('.type-option.home').classList.add('selected');
        
        // Reset location
        window.appState.currentLocation = null;
        document.getElementById('locationCoordinates').textContent = 'Latitude: Not set | Longitude: Not set';
        
        // Clear errors
        this.clearFormErrors();
        
        openModal('addressFormModal');
    },
    
    // Edit address
    editAddress: function(addressId) {
        const address = window.appState.addresses.find(addr => addr.id === addressId);
        if (!address) return;
        
        window.appState.editingAddressId = addressId;
        
        // Fill form
        document.getElementById('addressFormTitle').textContent = 'Edit Address';
        document.getElementById('addressId').value = address.id;
        document.getElementById('addressFullName').value = address.fullName || '';
        document.getElementById('addressPhone').value = address.phone || '';
        document.getElementById('addressLine1').value = address.addressLine1 || '';
        document.getElementById('addressLine2').value = address.addressLine2 || '';
        document.getElementById('addressCity').value = address.city || '';
        document.getElementById('addressState').value = address.state || '';
        document.getElementById('addressPostalCode').value = address.postalCode || '';
        document.getElementById('addressCountry').value = address.country || 'Pakistan';
        document.getElementById('addressInstructions').value = address.instructions || '';
        document.getElementById('setAsDefault').checked = address.isDefault || false;
        
        // Set type
        window.appState.currentAddressType = address.type || 'home';
        document.querySelectorAll('.type-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector(`.type-option.${window.appState.currentAddressType}`).classList.add('selected');
        
        // Set location
        if (address.latitude && address.longitude) {
            window.appState.currentLocation = { lat: address.latitude, lng: address.longitude };
            document.getElementById('locationCoordinates').textContent = 
                `Latitude: ${address.latitude.toFixed(6)} | Longitude: ${address.longitude.toFixed(6)}`;
        } else {
            window.appState.currentLocation = null;
            document.getElementById('locationCoordinates').textContent = 'Latitude: Not set | Longitude: Not set';
        }
        
        this.clearFormErrors();
        openModal('addressFormModal');
    },
    
    // Get current location
    getCurrentLocation: function() {
        if (!navigator.geolocation) {
            window.notifications.showNotification('Geolocation is not supported by your browser');
            return;
        }
        
        window.notifications.showNotification('Getting your location...');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                window.appState.currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                document.getElementById('locationCoordinates').textContent = 
                    `Latitude: ${window.appState.currentLocation.lat.toFixed(6)} | Longitude: ${window.appState.currentLocation.lng.toFixed(6)}`;
                
                window.notifications.showNotification('📍 Location captured successfully!');
            },
            (error) => {
                console.error('Error getting location:', error);
                window.notifications.showNotification('❌ Could not get your location. Please enter address manually.');
            }
        );
    },
    
    // Use current location to create address
    useCurrentLocation: function() {
        this.getCurrentLocation();
        setTimeout(() => {
            this.showAddressFormModal();
        }, 1000);
    },
    
    // Validate address form
    validateAddressForm: function() {
        let isValid = true;
        
        // Full Name
        const fullName = document.getElementById('addressFullName').value.trim();
        if (!fullName) {
            document.getElementById('nameError').style.display = 'block';
            document.getElementById('addressFullName').classList.add('error');
            isValid = false;
        } else {
            document.getElementById('nameError').style.display = 'none';
            document.getElementById('addressFullName').classList.remove('error');
        }
        
        // Phone
        const phone = document.getElementById('addressPhone').value.trim();
        if (!phone || phone.length < 10) {
            document.getElementById('phoneError').style.display = 'block';
            document.getElementById('addressPhone').classList.add('error');
            isValid = false;
        } else {
            document.getElementById('phoneError').style.display = 'none';
            document.getElementById('addressPhone').classList.remove('error');
        }
        
        // Address Line 1
        const addressLine1 = document.getElementById('addressLine1').value.trim();
        if (!addressLine1) {
            document.getElementById('address1Error').style.display = 'block';
            document.getElementById('addressLine1').classList.add('error');
            isValid = false;
        } else {
            document.getElementById('address1Error').style.display = 'none';
            document.getElementById('addressLine1').classList.remove('error');
        }
        
        // City
        const city = document.getElementById('addressCity').value.trim();
        if (!city) {
            document.getElementById('cityError').style.display = 'block';
            document.getElementById('addressCity').classList.add('error');
            isValid = false;
        } else {
            document.getElementById('cityError').style.display = 'none';
            document.getElementById('addressCity').classList.remove('error');
        }
        
        // State
        const state = document.getElementById('addressState').value.trim();
        if (!state) {
            document.getElementById('stateError').style.display = 'block';
            document.getElementById('addressState').classList.add('error');
            isValid = false;
        } else {
            document.getElementById('stateError').style.display = 'none';
            document.getElementById('addressState').classList.remove('error');
        }
        
        // Postal Code
        const postalCode = document.getElementById('addressPostalCode').value.trim();
        if (!postalCode) {
            document.getElementById('postalError').style.display = 'block';
            document.getElementById('addressPostalCode').classList.add('error');
            isValid = false;
        } else {
            document.getElementById('postalError').style.display = 'none';
            document.getElementById('addressPostalCode').classList.remove('error');
        }
        
        return isValid;
    },
    
    // Clear form errors
    clearFormErrors: function() {
        document.querySelectorAll('.error-message').forEach(element => {
            element.style.display = 'none';
        });
        
        document.querySelectorAll('.form-input').forEach(element => {
            element.classList.remove('error');
        });
    },
    
    // Save address
    saveAddress: function() {
        if (!this.validateAddressForm()) {
            return;
        }
        
        const addressData = {
            id: window.appState.editingAddressId || window.utils.generateId(),
            type: window.appState.currentAddressType,
            fullName: document.getElementById('addressFullName').value.trim(),
            phone: document.getElementById('addressPhone').value.trim(),
            addressLine1: document.getElementById('addressLine1').value.trim(),
            addressLine2: document.getElementById('addressLine2').value.trim(),
            city: document.getElementById('addressCity').value.trim(),
            state: document.getElementById('addressState').value.trim(),
            postalCode: document.getElementById('addressPostalCode').value.trim(),
            country: document.getElementById('addressCountry').value,
            instructions: document.getElementById('addressInstructions').value.trim(),
            isDefault: document.getElementById('setAsDefault').checked,
            latitude: window.appState.currentLocation ? window.appState.currentLocation.lat : null,
            longitude: window.appState.currentLocation ? window.appState.currentLocation.lng : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (window.appState.editingAddressId) {
            const index = window.appState.addresses.findIndex(addr => addr.id === window.appState.editingAddressId);
            if (index !== -1) {
                window.appState.addresses[index] = addressData;
            }
        } else {
            window.appState.addresses.push(addressData);
        }
        
        // If set as default, update other addresses
        if (addressData.isDefault) {
            window.appState.addresses.forEach(addr => {
                if (addr.id !== addressData.id) {
                    addr.isDefault = false;
                }
            });
            window.appState.selectedAddressId = addressData.id;
        }
        
        // If this is the first address, set it as default
        if (window.appState.addresses.length === 1) {
            window.appState.addresses[0].isDefault = true;
            window.appState.selectedAddressId = window.appState.addresses[0].id;
        }
        
        this.saveAddresses();
        
        window.notifications.showNotification('✅ Address saved successfully!');
        closeModal('addressFormModal');
        
        if (window.appState.currentPage === 'addressPage') {
            this.loadAddressPage();
        }
        
        this.updateDefaultAddressSummary();
        
        if (window.appState.isSelectingAddressForCheckout && window.appState.selectedAddressId) {
            this.updateSelectedAddressDisplay();
        }
    },
    
    // Delete address
    deleteAddress: function(addressId) {
        if (!confirm('Are you sure you want to delete this address?')) {
            return;
        }
        
        const index = window.appState.addresses.findIndex(addr => addr.id === addressId);
        if (index === -1) return;
        
        const wasDefault = window.appState.addresses[index].isDefault;
        
        window.appState.addresses.splice(index, 1);
        
        if (wasDefault && window.appState.addresses.length > 0) {
            window.appState.addresses[0].isDefault = true;
            window.appState.selectedAddressId = window.appState.addresses[0].id;
        }
        
        if (window.appState.addresses.length === 0) {
            window.appState.selectedAddressId = null;
        }
        
        this.saveAddresses();
        
        window.notifications.showNotification('🗑️ Address deleted');
        
        if (window.appState.currentPage === 'addressPage') {
            this.loadAddressPage();
        }
        
        this.updateDefaultAddressSummary();
    },
    
    // Set default address
    setDefaultAddress: function(addressId) {
        window.appState.addresses.forEach(addr => {
            addr.isDefault = addr.id === addressId;
        });
        
        window.appState.selectedAddressId = addressId;
        this.saveAddresses();
        
        window.notifications.showNotification('⭐ Address set as default');
        
        if (window.appState.currentPage === 'addressPage') {
            this.loadAddressPage();
        }
        
        this.updateDefaultAddressSummary();
    },
    
    // Load address page
    loadAddressPage: function() {
        const addressList = document.getElementById('addressList');
        
        if (window.appState.addresses.length === 0) {
            addressList.innerHTML = `
                <div class="no-addresses">
                    <i class="fas fa-map-marker-alt"></i>
                    <h3>No Addresses Yet</h3>
                    <p>Add your first shipping address to get started.</p>
                    <button onclick="window.address.showAddressFormModal()" style="padding:12px 30px;background:var(--primary-gradient);color:white;border:none;border-radius:12px;font-weight:700;cursor:pointer;">
                        <i class="fas fa-plus"></i> Add First Address
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        window.appState.addresses.forEach(address => {
            const typeIcon = {
                'home': 'fa-home',
                'work': 'fa-briefcase',
                'other': 'fa-map-pin'
            }[address.type] || 'fa-map-marker-alt';
            
            const typeText = address.type.charAt(0).toUpperCase() + address.type.slice(1);
            
            html += `
                <div class="address-card ${address.type}">
                    <div class="address-type ${address.type}">${typeText}</div>
                    
                    <div class="address-header">
                        <div class="address-icon ${address.type}">
                            <i class="fas ${typeIcon}"></i>
                        </div>
                        <div class="address-name">${address.fullName}</div>
                    </div>
                    
                    <div class="address-details">
                        ${address.addressLine1}<br>
                        ${address.addressLine2 ? address.addressLine2 + '<br>' : ''}
                        ${address.city}, ${address.state}<br>
                        ${address.postalCode} ${address.country}
                    </div>
                    
                    <div class="address-phone">
                        <i class="fas fa-phone"></i>
                        <span>${address.phone}</span>
                    </div>
                    
                    ${address.instructions ? `
                        <div style="font-size:12px;color:#94a3b8;margin-top:10px;padding:8px;background:#f8fafc;border-radius:6px;">
                            <i class="fas fa-info-circle"></i> ${address.instructions}
                        </div>
                    ` : ''}
                    
                    <div class="address-actions">
                        <button class="address-btn edit" onclick="window.address.editAddress('${address.id}'); event.stopPropagation();">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="address-btn delete" onclick="window.address.deleteAddress('${address.id}'); event.stopPropagation();">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                        ${!address.isDefault ? `
                            <button class="address-btn default" onclick="window.address.setDefaultAddress('${address.id}'); event.stopPropagation();">
                                <i class="fas fa-star"></i> Set Default
                            </button>
                        ` : ''}
                    </div>
                    
                    ${address.isDefault ? `
                        <div class="default-badge">
                            <i class="fas fa-star"></i> Default
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        addressList.innerHTML = html;
    },
    
    // Update default address summary
    updateDefaultAddressSummary: function() {
        const defaultAddress = window.appState.addresses.find(addr => addr.isDefault);
        const summaryElement = document.getElementById('defaultAddressSummary');
        
        if (defaultAddress && summaryElement) {
            const shortAddress = `${defaultAddress.addressLine1}, ${defaultAddress.city}`;
            summaryElement.textContent = shortAddress.length > 30 ? shortAddress.substring(0, 27) + '...' : shortAddress;
            summaryElement.style.color = '#10b981';
            summaryElement.style.fontWeight = '800';
        } else {
            if (summaryElement) {
                summaryElement.textContent = 'Manage shipping addresses';
                summaryElement.style.color = '';
                summaryElement.style.fontWeight = '';
            }
        }
    },
    
    // Select address for checkout
    selectAddressForCheckout: function() {
        window.appState.isSelectingAddressForCheckout = true;
        this.showAddressSelectionModal();
    },
    
    // Select address for buy now
    selectAddressForBuyNow: function() {
        window.appState.isSelectingAddressForCheckout = true;
        this.showAddressSelectionModal();
    },
    
    // Show address selection modal
    showAddressSelectionModal: function() {
        const addressList = document.getElementById('addressSelectionList');
        
        if (window.appState.addresses.length === 0) {
            addressList.innerHTML = `
                <div class="no-addresses" style="padding:20px;text-align:center;">
                    <i class="fas fa-map-marker-alt" style="font-size:40px;"></i>
                    <h3 style="font-size:16px;margin:10px 0;">No Addresses</h3>
                    <p style="color:#64748b;font-size:14px;">Please add a shipping address first.</p>
                    <button onclick="window.address.showAddressFormModal(true)" style="padding:10px 20px;background:var(--primary-gradient);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;margin-top:10px;">
                        <i class="fas fa-plus"></i> Add Address
                    </button>
                </div>
            `;
            document.getElementById('confirmAddressBtn').style.display = 'none';
        } else {
            let html = '';
            window.appState.addresses.forEach(address => {
                const typeIcon = {
                    'home': 'fa-home',
                    'work': 'fa-briefcase',
                    'other': 'fa-map-pin'
                }[address.type] || 'fa-map-marker-alt';
                
                const isSelected = window.appState.selectedAddressId === address.id;
                
                html += `
                    <div class="address-card ${address.type}" 
                         onclick="window.address.selectAddressInModal('${address.id}')"
                         style="cursor:pointer; ${isSelected ? 'border-color:#10b981;background:rgba(16,185,129,0.05);' : ''}">
                        <div class="address-type ${address.type}">${address.type.charAt(0).toUpperCase() + address.type.slice(1)}</div>
                        
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                            <div class="address-icon ${address.type}" style="width:30px;height:30px;font-size:14px;">
                                <i class="fas ${typeIcon}"></i>
                            </div>
                            <div class="address-name" style="font-size:16px;">${address.fullName}</div>
                            ${address.isDefault ? `
                                <div style="background:var(--success-gradient);color:white;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;">
                                    DEFAULT
                                </div>
                            ` : ''}
                            ${isSelected ? `
                                <div style="margin-left:auto;color:#10b981;">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div style="color:#475569;font-size:13px;line-height:1.4;">
                            ${address.addressLine1}<br>
                            ${address.addressLine2 ? address.addressLine2 + '<br>' : ''}
                            ${address.city}, ${address.state}, ${address.country}<br>
                            <small style="color:#64748b;"><i class="fas fa-phone"></i> ${address.phone}</small>
                        </div>
                    </div>
                `;
            });
            
            addressList.innerHTML = html;
            document.getElementById('confirmAddressBtn').style.display = 'block';
        }
        
        openModal('addressSelectionModal');
    },
    
    // Select address in modal
    selectAddressInModal: function(addressId) {
        window.appState.selectedAddressId = addressId;
        this.showAddressSelectionModal();
    },
    
    // Confirm address selection
    confirmAddressSelection: function() {
        if (!window.appState.selectedAddressId) {
            window.notifications.showNotification('Please select an address');
            return;
        }
        
        closeModal('addressSelectionModal');
        this.updateSelectedAddressDisplay();
    },
    
    // Update selected address display
    updateSelectedAddressDisplay: function() {
        let selectedAddress = this.getSelectedAddress();
        
        if (selectedAddress) {
            // Update checkout address display
            const checkoutAddressDisplay = document.getElementById('selectedAddressSummary');
            if (checkoutAddressDisplay) {
                checkoutAddressDisplay.innerHTML = `
                    <div style="font-weight:800;color:var(--dark-color);margin-bottom:4px;">${selectedAddress.fullName}</div>
                    <div style="color:#475569;font-size:13px;">
                        ${selectedAddress.addressLine1}<br>
                        ${selectedAddress.addressLine2 ? selectedAddress.addressLine2 + '<br>' : ''}
                        ${selectedAddress.city}, ${selectedAddress.state}<br>
                        <span style="color:#64748b;"><i class="fas fa-phone"></i> ${selectedAddress.phone}</span>
                    </div>
                `;
            }
            
            // Update buy now address display
            const buyNowAddressDisplay = document.getElementById('buyNowAddressDisplay');
            if (buyNowAddressDisplay) {
                const shortAddress = `${selectedAddress.addressLine1}, ${selectedAddress.city}`;
                buyNowAddressDisplay.textContent = shortAddress.length > 25 ? 
                    shortAddress.substring(0, 22) + '...' : shortAddress;
            }
        }
    },
    
    // Get selected address
    getSelectedAddress: function() {
        if (!window.appState.selectedAddressId) {
            const defaultAddress = window.appState.addresses.find(addr => addr.isDefault);
            if (defaultAddress) {
                window.appState.selectedAddressId = defaultAddress.id;
                return defaultAddress;
            }
            return null;
        }
        
        return window.appState.addresses.find(addr => addr.id === window.appState.selectedAddressId);
    },
    
    // Format address for WhatsApp
    formatAddressForWhatsApp: function(address) {
        if (!address) return 'Address will be provided separately';
        
        return `📍 *Delivery Address:*\n` +
               `👤 ${address.fullName}\n` +
               `📞 ${address.phone}\n` +
               `🏠 ${address.addressLine1}\n` +
               `${address.addressLine2 ? address.addressLine2 + '\n' : ''}` +
               `${address.city}, ${address.state}\n` +
               `${address.postalCode} ${address.country}` +
               `${address.instructions ? `\n📝 *Instructions:* ${address.instructions}` : ''}`;
    }
};
