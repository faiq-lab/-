// ========== SERVICE WORKER FOR AUTO BACKUP ==========
self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

// Scheduled backups
self.addEventListener('sync', event => {
    if (event.tag === 'daily-backup') {
        event.waitUntil(performBackup());
    }
});

// Periodic backups (requires permission)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'hourly-backup') {
        event.waitUntil(performBackup());
    }
});

async function performBackup() {
    try {
        // Get all card data from IndexedDB
        const cards = await getAllCards();
        const orders = await getAllOrders();
        
        // Create backup package
        const backup = {
            timestamp: new Date().toISOString(),
            cards,
            orders,
            version: '2.0.0'
        };
        
        // Encrypt
        const encrypted = await encryptBackup(backup);
        
        // Store in IndexedDB
        await saveBackup(encrypted);
        
        // Try to upload to cloud if connected
        if (navigator.onLine) {
            await uploadToCloud(encrypted);
        }
        
        // Notify user
        self.registration.showNotification('Backup Complete', {
            body: 'Your data has been automatically backed up',
            icon: '/icon-192.png'
        });
        
    } catch (error) {
        console.error('Auto backup failed:', error);
    }
}
