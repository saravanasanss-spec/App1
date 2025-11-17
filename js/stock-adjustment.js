// Stock Adjustment Management

const StockAdjustment = {
    init() {
        // Initialize stock adjustment storage
        if (!localStorage.getItem('stockAdjustments')) {
            localStorage.setItem('stockAdjustments', JSON.stringify([]));
        }
    },

    // Log stock adjustment
    async logAdjustment(adjustmentData) {
        const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
        const adjustment = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            menuId: adjustmentData.menuId,
            itemName: adjustmentData.itemName,
            quantity: adjustmentData.quantity,
            reason: adjustmentData.reason || 'Manual adjustment',
            adjustmentType: adjustmentData.adjustmentType || 'adjustment', // 'adjustment', 'sale', 'receipt'
            userId: currentUser ? currentUser.id : null,
            userName: currentUser ? currentUser.name : 'Unknown',
            userUsername: currentUser ? currentUser.username : 'unknown',
            date: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        // Save to cloud
        if (typeof CloudStorage !== 'undefined' && CloudStorage.isAvailable && typeof db !== 'undefined' && db) {
            try {
                await db.collection('stockAdjustments').doc(adjustment.id).set(adjustment);
            } catch (error) {
                console.error('Error saving stock adjustment to cloud:', error);
            }
        }

        // Save to localStorage with resilient fallback
        let adjustments;
        try {
            adjustments = await this.getAdjustments();
            if (!Array.isArray(adjustments)) {
                throw new Error('Adjustments result is not an array');
            }
        } catch (error) {
            console.warn('Falling back to local adjustments due to error:', error);
            adjustments = this.getAdjustmentsLocal();
        }
        adjustments.push(adjustment);
        localStorage.setItem('stockAdjustments', JSON.stringify(adjustments));

        return adjustment;
    },

    // Get all adjustments
    async getAdjustments() {
        if (typeof CloudStorage !== 'undefined' && CloudStorage.isAvailable && typeof db !== 'undefined' && db) {
            try {
                const snapshot = await db.collection('stockAdjustments')
                    .orderBy('date', 'desc')
                    .get();
                
                const adjustments = [];
                snapshot.forEach(doc => {
                    adjustments.push(doc.data());
                });

                // Sync to localStorage
                localStorage.setItem('stockAdjustments', JSON.stringify(adjustments));
                return adjustments;
            } catch (error) {
                console.error('Error fetching stock adjustments from cloud:', error);
                return this.getAdjustmentsLocal();
            }
        } else {
            return this.getAdjustmentsLocal();
        }
    },

    getAdjustmentsLocal() {
        const adjustments = localStorage.getItem('stockAdjustments');
        return adjustments ? JSON.parse(adjustments) : [];
    },

    // Manual stock adjustment
    async adjustStock(menuId, quantity, reason) {
        // Get the item using menuId
        const menuItems = Storage.getMenuItems();
        const menuItem = menuItems.find(m => m.menuId === menuId);
        
        if (!menuItem) {
            throw new Error('Menu item not found');
        }

        // 1. Calculate the new stock
        const newStock = Math.max(0, (menuItem.stock || 0) + quantity);

        // 2. Update stock in LocalStorage and get the updated item object
        const updatedItem = Storage.updateStock(menuId, quantity);

        // 3. Log adjustment (this is already working)
        await this.logAdjustment({
            menuId: menuId,
            itemName: menuItem.name,
            quantity: quantity,
            reason: reason || 'Manual adjustment',
            adjustmentType: quantity > 0 ? 'receipt' : 'adjustment'
        });

        // 4. *** CRITICAL FIX: Update the menu item in Cloud Storage ***
        if (typeof CloudStorage !== 'undefined' && CloudStorage.isAvailable && updatedItem) {
            try {
                // Prefer the item's unique 'id', but fall back to menuId if needed
                const docId = updatedItem.id || menuItem.id;
                if (docId) {
                    await CloudStorage.updateMenuItem(docId, {
                        stock: newStock,
                        updatedAt: new Date().toISOString()
                    });
                } else {
                    console.warn('Unable to determine document id for cloud stock sync');
                }
            } catch (error) {
                console.error('Error synchronizing stock adjustment to cloud:', error);
                // The local data is updated, so the user can continue working
            }
        }

        return updatedItem;
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    StockAdjustment.init();
}