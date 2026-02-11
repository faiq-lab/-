// ===== ADMIN MANAGEMENT SYSTEM =====
window.admin = {
    // Toggle login/logout
    toggleLogin: function() {
        if (window.appState.isAdminLoggedIn) {
            if (confirm("Are you sure you want to logout?")) {
                this.logoutAdmin();
            }
        } else {
            navigateTo('loginPage');
        }
    },
    
    // Update login UI
    updateLoginUI: function() {
        const loginIcon = document.getElementById('loginIcon');
        const loginBtn = document.getElementById('loginBtn');
        
        if (window.appState.isAdminLoggedIn) {
            loginIcon.className = 'fas fa-sign-out-alt';
            loginBtn.title = 'Logout';
        } else {
            loginIcon.className = 'fas fa-sign-in-alt';
            loginBtn.title = 'Login';
        }
    },
    
    // Attempt login
    attemptLogin: function() {
        const passwordInput = document.getElementById('adminPasswordInput');
        const enteredPassword = passwordInput.value;
        
        if (enteredPassword === window.appState.businessAdminPassword) {
            window.appState.isAdminLoggedIn = true;
            window.isolatedStorage.setItem('isAdminLoggedIn', 'true');
            this.updateLoginUI();
            window.notifications.showNotification('✅ Login successful!');
            window.notifications.addInnerNotification('Admin Login', 'You have logged in as administrator', 'success');
            navigateTo('adminPage');
        } else {
            window.notifications.showNotification('❌ Incorrect password. Try again.');
            passwordInput.value = '';
            passwordInput.focus();
        }
    },
    
    // Handle login keypress
    handleLoginKeypress: function(event) {
        if (event.key === 'Enter') {
            this.attemptLogin();
        }
    },
    
    // Logout admin
    logoutAdmin: function() {
        window.appState.isAdminLoggedIn = false;
        window.isolatedStorage.removeItem('isAdminLoggedIn');
        this.updateLoginUI();
        window.notifications.showNotification('👋 Logged out successfully');
        window.notifications.addInnerNotification('Logged Out', 'You have been logged out from admin panel', 'info');
        navigateTo('homePage');
    },
    
    // Load admin panel
    loadAdminPanel: async function() {
        const { data, error } = await window.supabaseClient
            .from('delivery_status')
            .select('*')
            .order('last_updated', { ascending: false });
            
        if (error || !data) {
            document.getElementById('adminContent').innerHTML = '<p style="padding:20px;color:#ef4444;">Error loading data</p>';
            return;
        }
        
        let html = `
            <div style="padding: 15px; display: flex; justify-content: flex-end;">
                <button onclick="window.admin.logoutAdmin()" class="logout-btn">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
            
            <input type="text" class="admin-search" id="adminSearch" placeholder="Search orders by ID, phone, name..." onkeyup="window.admin.searchAdminOrders()">
            
            <div style="margin: 15px; display: flex; gap: 10px;">
                <button onclick="window.admin.sendNotificationToAll()" style="flex:1;padding:12px;background:var(--warning-gradient);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
                    <i class="fas fa-bell"></i> Send Alert to All
                </button>
                <button onclick="window.admin.testNotification()" style="flex:1;padding:12px;background:var(--info-gradient);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
                    <i class="fas fa-bell"></i> Test Alert
                </button>
                <button onclick="window.admin.openScheduleNotification()" style="flex:1;padding:12px;background:var(--secondary-gradient);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
                    <i class="fas fa-clock"></i> Schedule Alert
                </button>
            </div>
            
            <button onclick="window.admin.addNewOrder()" class="admin-btn">
                <i class="fas fa-plus"></i> Add New Order
            </button>
        `;
        
        if (data.length === 0) {
            html += '<p style="text-align:center;padding:40px;color:#64748b;">No orders found</p>';
        } else {
            data.forEach(order => {
                const statusClass = order.status;
                const updatedTime = new Date(order.last_updated).toLocaleString();
                
                html += `
                    <div class="admin-order-card" data-order-id="${order.order_id}" data-phone="${order.customer_phone}">
                        <div class="admin-order-header">
                            <div>
                                <div class="admin-order-id">Order #${order.order_id}</div>
                                <div class="admin-customer-info">${order.customer_name || 'No name'}</div>
                                <div class="admin-customer-info">${order.customer_phone}</div>
                            </div>
                            <div style="font-size:12px;color:#94a3b8;">${updatedTime}</div>
                        </div>
                        
                        <select class="admin-select" data-id="${order.id}">
                            <option value="pending" ${statusClass === 'pending' ? 'selected' : ''}>⏳ Pending</option>
                            <option value="processing" ${statusClass === 'processing' ? 'selected' : ''}>🔄 Processing</option>
                            <option value="shipped" ${statusClass === 'shipped' ? 'selected' : ''}>🚚 Shipped</option>
                            <option value="delivered" ${statusClass === 'delivered' ? 'selected' : ''}>✅ Delivered</option>
                            <option value="cancelled" ${statusClass === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                        </select>
                        
                        <input type="text" class="admin-input" data-id="${order.id}" 
                               placeholder="Location" value="${order.location || ''}">
                               
                        <input type="text" class="admin-input" data-id="${order.id}" 
                               placeholder="Delivery Person" value="${order.delivery_person || ''}">
                               
                        <button onclick="window.admin.updateOrder('${order.id}')" class="admin-btn success">
                            Update Order
                        </button>
                    </div>
                `;
            });
        }
        
        document.getElementById('adminContent').innerHTML = html;
    },
    
    // Search admin orders
    searchAdminOrders: function() {
        const searchTerm = document.getElementById('adminSearch').value.toLowerCase();
        const cards = document.querySelectorAll('.admin-order-card');
        
        cards.forEach(card => {
            const orderId = card.getAttribute('data-order-id').toLowerCase();
            const phone = card.getAttribute('data-phone').toLowerCase();
            const text = card.textContent.toLowerCase();
            
            if (orderId.includes(searchTerm) || phone.includes(searchTerm) || text.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    },
    
    // Update order
    updateOrder: async function(orderId) {
        const status = document.querySelector(`.admin-select[data-id="${orderId}"]`).value;
        const location = document.querySelector(`.admin-input[data-id="${orderId}"]`).value;
        const deliveryPerson = document.querySelectorAll(`.admin-input[data-id="${orderId}"]`)[1]?.value;
        
        const { error } = await window.supabaseClient
            .from('delivery_status')
            .update({
                status: status,
                location: location,
                delivery_person: deliveryPerson,
                last_updated: new Date().toISOString()
            })
            .eq('id', orderId);
            
        if (!error) {
            window.notifications.showNotification('✅ Order updated successfully!');
            window.notifications.addInnerNotification('Order Updated', `Order updated to ${status}`, 'success');
            this.loadAdminPanel();
            window.delivery.loadDeliveryStatus();
        } else {
            window.notifications.showNotification('❌ Error updating order');
        }
    },
    
    // Add new order
    addNewOrder: function() {
        const orderId = prompt("Enter Order ID:");
        const customerPhone = prompt("Enter Customer Phone:");
        const customerName = prompt("Enter Customer Name (optional):");
        
        if (!orderId || !customerPhone) {
            window.notifications.showNotification('❌ Order ID and Phone are required');
            return;
        }
        
        window.supabaseClient
            .from('delivery_status')
            .insert([{
                order_id: orderId,
                customer_phone: customerPhone,
                customer_name: customerName || '',
                status: 'pending',
                location: '',
                delivery_person: '',
                last_updated: new Date().toISOString()
            }])
            .then(({ error }) => {
                if (!error) {
                    window.notifications.showNotification('✅ Order added successfully!');
                    window.notifications.addInnerNotification('New Order', `Order #${orderId} added`, 'success');
                    this.loadAdminPanel();
                } else {
                    window.notifications.showNotification('❌ Error adding order: ' + error.message);
                }
            });
    },
    
    // Send notification to all users
    sendNotificationToAll: async function(title, body, imageUrl = null) {
        if (!window.appState.isAdminLoggedIn) {
            window.notifications.showNotification('❌ Admin access required');
            return;
        }
        
        if (!title || !body) {
            title = prompt('Notification Title:', 'New Update');
            body = prompt('Notification Message:', 'Check out our latest products!');
            imageUrl = prompt('Image URL (optional):', '');
            
            if (!title || !body) return;
        }
        
        const { error } = await window.supabaseClient
            .from('notifications')
            .insert([{ 
                title, 
                body,
                image_url: imageUrl || null 
            }]);
            
        if (!error) {
            window.notifications.showNotification('✅ Notification sent to all users!');
            window.notifications.addInnerNotification('Notification Sent', `"${title}" sent to all users`, 'success');
        } else {
            window.notifications.showNotification('❌ Error sending notification');
        }
    },
    
    // Test notification
    testNotification: function() {
        window.notifications.enableNotifications();
        window.notifications.addInnerNotification('Test Notification', 'This is a test notification!', 'info');
        window.notifications.showNotification('✅ Test notification sent');
    },
    
    // Open schedule notification
    openScheduleNotification: function() {
        const title = prompt("Notification Title:", "Special Offer!");
        const body = prompt("Notification Message:", "Check out our latest products with amazing discounts!");
        const imageUrl = prompt("Image URL (optional):", "");
        const delayMinutes = prompt("Schedule after how many minutes?", "60");
        
        if (title && body && delayMinutes) {
            this.scheduleExternalNotification(title, body, imageUrl || null, parseInt(delayMinutes));
        }
    },
    
    // Schedule external notification
    scheduleExternalNotification: async function(title, body, imageUrl = null, delayMinutes = 60) {
        if (!window.appState.isAdminLoggedIn) return;
        
        const scheduledFor = new Date(Date.now() + delayMinutes * 60000).toISOString();
        
        const { error } = await window.supabaseClient
            .from('scheduled_notifications')
            .insert([{
                business_id: window.appState.currentBusinessId,
                title: title,
                body: body,
                image_url: imageUrl,
                scheduled_for: scheduledFor,
                sent: false
            }]);
        
        if (!error) {
            window.notifications.showNotification(`✅ Notification scheduled for ${delayMinutes} minutes from now`);
        }
    }
};

// Handle login keypress
function handleLoginKeypress(event) {
    window.admin.handleLoginKeypress(event);
}
