// ===== DATA ISOLATION SYSTEM =====
window.isolatedStorage = {
    getStorageKey: function(key) {
        const businessId = window.appState.currentBusinessId || 'default';
        const businessKey = businessId.substring(0, 8);
        return `business_${businessKey}_${key}`;
    },
    
    setItem: function(key, value) {
        const storageKey = this.getStorageKey(key);
        return localStorage.setItem(storageKey, value);
    },
    
    getItem: function(key) {
        const storageKey = this.getStorageKey(key);
        return localStorage.getItem(storageKey);
    },
    
    removeItem: function(key) {
        const storageKey = this.getStorageKey(key);
        return localStorage.removeItem(storageKey);
    },
    
    clear: function() {
        const prefix = this.getStorageKey('');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        }
    }
};

// ===== NOTIFICATION SYSTEM =====
window.notifications = {
    showNotification: function(message) {
        const notification = document.getElementById('notificationAlert');
        notification.textContent = message;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    },
    
    addInnerNotification: function(title, message, type = 'info') {
        const notification = {
            id: Date.now(),
            title,
            message,
            type,
            time: new Date(),
            read: false
        };
        
        window.appState.innerNotifications.unshift(notification);
        window.appState.unreadNotifications++;
        
        // Keep only last 50 notifications
        if (window.appState.innerNotifications.length > 50) {
            window.appState.innerNotifications.pop();
        }
        
        this.saveInnerNotifications();
        this.updateNotificationBellCount();
        
        // Update drawer if open
        if (document.getElementById('notificationDrawer').classList.contains('open')) {
            this.loadNotificationDrawer();
        }
        
        return notification.id;
    },
    
    saveInnerNotifications: function() {
        window.isolatedStorage.setItem('innerNotifications', JSON.stringify(window.appState.innerNotifications));
    },
    
    loadInnerNotifications: function() {
        const saved = window.isolatedStorage.getItem('innerNotifications');
        if (saved) {
            window.appState.innerNotifications = JSON.parse(saved);
            window.appState.unreadNotifications = window.appState.innerNotifications.filter(n => !n.read).length;
            this.updateNotificationBellCount();
        }
    },
    
    updateNotificationBellCount: function() {
        const badge = document.getElementById('notificationBadge');
        const bell = document.getElementById('notificationBell');
        
        if (window.appState.unreadNotifications > 0) {
            badge.textContent = window.appState.unreadNotifications > 9 ? '9+' : window.appState.unreadNotifications;
            badge.style.display = 'flex';
            badge.classList.add('alert');
            bell.style.color = '#f59e0b';
        } else {
            badge.style.display = 'none';
            badge.classList.remove('alert');
            if (window.appState.notificationPermission) {
                bell.style.color = '#f59e0b';
            } else {
                bell.style.color = 'white';
            }
        }
    },
    
    toggleNotificationDrawer: function() {
        const drawer = document.getElementById('notificationDrawer');
        if (drawer.classList.contains('open')) {
            drawer.classList.remove('open');
        } else {
            drawer.classList.add('open');
            this.loadNotificationDrawer();
        }
    },
    
    loadNotificationDrawer: function() {
        const list = document.getElementById('notificationList');
        const count = document.getElementById('notificationCount');
        
        if (window.appState.innerNotifications.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-bell-slash" style="font-size: 60px; color: #cbd5e1; margin-bottom: 20px;"></i>
                    <h3 style="color: var(--dark-color); margin-bottom: 10px;">No notifications yet</h3>
                    <p style="color: #64748b;">Your notifications will appear here</p>
                    <button onclick="window.notifications.enableNotifications()" style="margin-top: 20px; padding: 10px 20px; background: var(--primary-gradient); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
                        Enable Alerts
                    </button>
                </div>
            `;
            count.textContent = '0';
            return;
        }
        
        let html = '';
        window.appState.innerNotifications.forEach(notif => {
            const timeAgo = this.getTimeAgo(notif.time);
            const icon = this.getNotificationIconByType(notif.type);
            const color = this.getNotificationColorByType(notif.type);
            
            html += `
                <div class="notification-item ${notif.read ? '' : 'unread'}" onclick="window.notifications.markNotificationAsRead(${notif.id})">
                    <div style="display: flex; align-items: start; gap: 12px;">
                        <div style="font-size: 20px; color: ${color}">${icon}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 800; color: var(--dark-color); font-size: 13px; margin-bottom: 4px;">${notif.title}</div>
                            <div style="color: #64748b; font-size: 12px; line-height: 1.4;">${notif.message}</div>
                            <div class="notification-time">
                                <i class="fas fa-clock" style="font-size: 10px;"></i>
                                <span>${timeAgo}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html;
        count.textContent = window.appState.unreadNotifications > 9 ? '9+' : window.appState.unreadNotifications;
    },
    
    markNotificationAsRead: function(id) {
        const index = window.appState.innerNotifications.findIndex(n => n.id === id);
        if (index !== -1 && !window.appState.innerNotifications[index].read) {
            window.appState.innerNotifications[index].read = true;
            window.appState.unreadNotifications--;
            this.saveInnerNotifications();
            this.updateNotificationBellCount();
            this.loadNotificationDrawer();
        }
    },
    
    markAllNotificationsAsRead: function() {
        window.appState.innerNotifications.forEach(n => n.read = true);
        window.appState.unreadNotifications = 0;
        this.saveInnerNotifications();
        this.updateNotificationBellCount();
        this.loadNotificationDrawer();
        this.showNotification('✅ All notifications marked as read');
    },
    
    getTimeAgo: function(date) {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return new Date(date).toLocaleDateString();
    },
    
    getNotificationIconByType: function(type) {
        const icons = {
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'info': 'ℹ️',
            'delivery': '🚚',
            'order': '📦',
            'system': '🔔'
        };
        return icons[type] || icons.info;
    },
    
    getNotificationColorByType: function(type) {
        const colors = {
            'success': '#10b981',
            'warning': '#f59e0b',
            'error': '#ef4444',
            'info': '#3b82f6',
            'delivery': '#8b5cf6',
            'order': '#8b5cf6',
            'system': '#667eea'
        };
        return colors[type] || colors.info;
    },
    
    enableNotifications: async function() {
        if (!('Notification' in window)) {
            this.showNotification('❌ Notifications not supported on this device');
            return;
        }
        
        if (Notification.permission === 'granted') {
            this.showNotification('✅ Notifications already enabled!');
            window.appState.notificationPermission = true;
            this.updateNotificationBellCount();
            this.addInnerNotification('Notifications Enabled', 'You will receive alerts for updates and deliveries', 'success');
            return;
        }
        
        if (Notification.permission === 'denied') {
            this.showNotification('❌ Notifications blocked. Please enable in browser settings.');
            return;
        }
        
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            this.showNotification('✅ Notifications enabled! You will receive alerts.');
            window.appState.notificationPermission = true;
            this.updateNotificationBellCount();
            this.addInnerNotification('Notifications Enabled', 'You will receive alerts for updates and deliveries', 'success');
        } else {
            this.showNotification('❌ Notifications disabled. You wont receive alerts.');
        }
    }
};

// ===== UTILITY FUNCTIONS =====
window.utils = {
    generateId: function() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    generateShortId: function() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let shortId = '';
        for (let i = 0; i < 6; i++) {
            shortId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return shortId;
    },
    
    generateDeviceId: function() {
        let deviceId = localStorage.getItem('customer_device_id');
        if (!deviceId) {
            deviceId = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('customer_device_id', deviceId);
        }
        return deviceId;
    },
    
    formatCurrency: function(amount) {
        return `PKR ${parseFloat(amount).toFixed(2)}`;
    },
    
    getCustomerPhone: function() {
        const phone = window.isolatedStorage.getItem('customerPhone');
        if (!phone && window.appState.card.phone) {
            const savedBusinessPhone = window.isolatedStorage.getItem('businessPhone');
            if (savedBusinessPhone === window.appState.card.phone) {
                return window.appState.card.phone;
            }
        }
        return phone;
    },
    
    saveCustomerPhone: function(phone) {
        window.isolatedStorage.setItem('customerPhone', phone);
        window.appState.customerData.phone = phone;
    },
    
    saveBusinessPhone: function(phone) {
        window.isolatedStorage.setItem('businessPhone', phone);
    }
};

// ===== BUSINESS UTILITIES =====
window.businessUtils = {
    shareBusiness: function() {
        const businessName = window.appState.card.businessName || window.appState.card.name || "Business";
        const currentUrl = window.location.origin + window.location.pathname;
        const shareUrl = window.appState.shortCardId ? `${currentUrl}?id=${window.appState.shortCardId}` : currentUrl;
        const shareText = `Check out ${businessName} on their business app!`;
        const fullText = `${shareText}\n\n${shareUrl}`;
        
        if (navigator.share) {
            navigator.share({
                title: businessName,
                text: shareText,
                url: shareUrl
            }).catch(() => this.fallbackShare(fullText));
        } else {
            this.fallbackShare(fullText);
        }
    },
    
    fallbackShare: function(fullText) {
        const tempInput = document.createElement('input');
        tempInput.value = fullText;
        document.body.appendChild(tempInput);
        tempInput.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                window.notifications.showNotification('✅ Link copied to clipboard!');
            } else {
                prompt('Copy this link to share:', fullText);
            }
        } catch (err) {
            prompt('Copy this link to share:', fullText);
        }
        
        document.body.removeChild(tempInput);
    },
    
    saveBusinessToContacts: async function(silent = false) {
        if (!window.appState.card.name || !window.appState.card.phone) {
            if (!silent) {
                window.notifications.showNotification('❌ Business information incomplete');
            }
            return;
        }
        
        if (!('contacts' in navigator && 'ContactsManager' in window)) {
            if (!silent) {
                this.showSaveContactsFallback();
            }
            return;
        }
        
        try {
            const granted = await navigator.permissions.query({ name: 'contacts' });
            
            if (granted.state === 'granted') {
                const contact = {
                    name: [window.appState.card.name],
                    tel: [{
                        number: window.appState.card.phone,
                        type: 'work'
                    }],
                    email: window.appState.card.email ? [{
                        address: window.appState.card.email,
                        type: 'work'
                    }] : [],
                    note: [window.appState.card.businessName || 'Business Contact'],
                    url: window.appState.card.website ? [{
                        url: window.appState.card.website,
                        type: 'work'
                    }] : [],
                    address: window.appState.card.address ? [{
                        streetAddress: window.appState.card.address,
                        type: 'work'
                    }] : []
                };
                
                await navigator.contacts.save(contact);
                
                if (!silent) {
                    window.notifications.showNotification('✅ Business saved to contacts!');
                }
                
                window.notifications.addInnerNotification('Contact Saved', `${window.appState.card.name} saved to your phonebook`, 'success');
            } else {
                if (!silent) {
                    this.showSaveContactsFallback();
                }
            }
        } catch (error) {
            console.log('Error saving contact:', error);
            if (!silent) {
                this.showSaveContactsFallback();
            }
        }
    },
    
    showSaveContactsFallback: function() {
        const businessName = window.appState.card.name || 'Business';
        const phone = window.appState.card.phone || '';
        const email = window.appState.card.email || '';
        const address = window.appState.card.address || '';
        
        let contactInfo = `Business: ${businessName}\n`;
        contactInfo += `Phone: ${phone}\n`;
        if (email) contactInfo += `Email: ${email}\n`;
        if (address) contactInfo += `Address: ${address}\n`;
        
        navigator.clipboard.writeText(contactInfo).then(() => {
            window.notifications.showNotification('📋 Contact info copied! Paste in your contacts app');
        }).catch(() => {
            prompt('Copy this contact information:', contactInfo);
        });
    }
};
