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
        if (typeof CloudStorage !== 'undefined' && CloudStorage.isAvailable && db) {
            try {
                await db.collection('stockAdjustments').doc(adjustment.id).set(adjustment);
            } catch (error) {
                console.error('Error saving stock adjustment to cloud:', error);
            }
        }

        // Save to localStorage
        // FIX: Await the asynchronous getAdjustments() call to get the array back
        const adjustments = await  this.getAdjustments();
        adjustments.push(adjustment);
        localStorage.setItem('stockAdjustments', JSON.stringify(adjustments));

        return adjustment;
    },

    // Get all adjustments
    async getAdjustments() {
        if (typeof CloudStorage !== 'undefined' && CloudStorage.isAvailable && db) {
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
        const menuItems = Storage.getMenuItems();
        const menuItem = menuItems.find(m => m.menuId === menuId);
        
        if (!menuItem) {
            throw new Error('Menu item not found');
        }

        // Update stock
        Storage.updateStock(menuId, quantity);

        // Log adjustment
        await this.logAdjustment({
            menuId: menuId,
            itemName: menuItem.name,
            quantity: quantity,
            reason: reason || 'Manual adjustment',
            adjustmentType: quantity > 0 ? 'receipt' : 'adjustment'
        });

        return menuItem;
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    StockAdjustment.init();
}

