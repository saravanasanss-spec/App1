// Cloud storage using Firebase Firestore
// Falls back to localStorage if Firebase is not configured

const CloudStorage = {
    isAvailable: false,
    db: null,

    init() {
        // Check if Firebase is available
        if (typeof firebase !== 'undefined' && firebaseInitialized && db) {
            this.db = db;
            this.isAvailable = true;
            console.log('Cloud storage enabled');
        } else {
            this.isAvailable = false;
            console.warn('Cloud storage not available. Using localStorage fallback.');
        }
    },

    // Transactions - Cloud Storage
    async addTransaction(transaction) {
        const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
        const newTransaction = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            items: transaction.items,
            total: transaction.total,
            discount: transaction.discount || 0,
            finalTotal: transaction.finalTotal || transaction.total,
            userId: currentUser ? currentUser.id : null,
            userName: currentUser ? currentUser.name : 'Unknown',
            userUsername: currentUser ? currentUser.username : 'unknown',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (this.isAvailable) {
            try {
                await this.db.collection('transactions').doc(newTransaction.id).set(newTransaction);
                // Also save to localStorage as backup
                const localTransactions = Storage.getTransactions();
                localTransactions.push(newTransaction);
                Storage.saveTransactions(localTransactions);
                return newTransaction;
            } catch (error) {
                console.error('Error saving transaction to cloud:', error);
                // Fallback to localStorage
                return Storage.addTransaction(transaction);
            }
        } else {
            // Fallback to localStorage
            return Storage.addTransaction(transaction);
        }
    },

    async getTransactions() {
        if (this.isAvailable) {
            try {
                const snapshot = await this.db.collection('transactions')
                    .orderBy('date', 'desc')
                    .get();
                
                const transactions = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    transactions.push({
                        id: doc.id,
                        date: data.date,
                        items: data.items,
                        total: data.total,
                        discount: data.discount || 0,
                        finalTotal: data.finalTotal || data.total,
                        userId: data.userId,
                        userName: data.userName,
                        userUsername: data.userUsername
                    });
                });

                // Sync to localStorage
                Storage.saveTransactions(transactions);
                return transactions;
            } catch (error) {
                console.error('Error fetching transactions from cloud:', error);
                // Fallback to localStorage
                return Storage.getTransactions();
            }
        } else {
            return Storage.getTransactions();
        }
    },

    // Menu Items - Cloud Storage (optional, can sync menu items too)
    async getMenuItems() {
        if (this.isAvailable) {
            try {
                const snapshot = await this.db.collection('menuItems').get();
                const items = [];
                snapshot.forEach(doc => {
                    items.push(doc.data());
                });
                
                if (items.length > 0) {
                    Storage.saveMenuItems(items);
                    return items;
                }
            } catch (error) {
                console.error('Error fetching menu items from cloud:', error);
            }
        }
        return Storage.getMenuItems();
    },

    async saveMenuItems(items) {
        // Save to localStorage first
        Storage.saveMenuItems(items);
        
        if (this.isAvailable && this.db) {
            try {
                // Delete all existing items first to ensure clean sync
                const snapshot = await this.db.collection('menuItems').get();
                const deleteBatch = this.db.batch();
                snapshot.forEach(doc => {
                    deleteBatch.delete(doc.ref);
                });
                await deleteBatch.commit();

                // Add all items in batches (Firestore limit is 500 operations per batch)
                const batchSize = 500;
                for (let i = 0; i < items.length; i += batchSize) {
                    const batch = this.db.batch();
                    const batchItems = items.slice(i, i + batchSize);
                    batchItems.forEach(item => {
                        const itemRef = this.db.collection('menuItems').doc(item.id);
                        batch.set(itemRef, item);
                    });
                    await batch.commit();
                }
            } catch (error) {
                console.error('Error saving menu items to cloud:', error);
                // localStorage already saved, so continue
            }
        }
    },

    async addMenuItem(item) {
        const newItem = Storage.addMenuItem(item);
        if (this.isAvailable) {
            try {
                await this.db.collection('menuItems').doc(newItem.id).set(newItem);
            } catch (error) {
                console.error('Error saving menu item to cloud:', error);
            }
        }
        return newItem;
    },

    async updateMenuItem(id, updatedItem) {
        const item = Storage.updateMenuItem(id, updatedItem);
        if (this.isAvailable && item) {
            try {
                await this.db.collection('menuItems').doc(id).update(updatedItem);
            } catch (error) {
                console.error('Error updating menu item in cloud:', error);
            }
        }
        return item;
    },

    async deleteMenuItem(id) {
        const items = Storage.deleteMenuItem(id);
        if (this.isAvailable) {
            try {
                await this.db.collection('menuItems').doc(id).delete();
            } catch (error) {
                console.error('Error deleting menu item from cloud:', error);
            }
        }
        return items;
    },

    // Real-time listener for transactions (optional)
    subscribeToTransactions(callback) {
        if (this.isAvailable) {
            return this.db.collection('transactions')
                .orderBy('date', 'desc')
                .onSnapshot((snapshot) => {
                    const transactions = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        transactions.push({
                            id: doc.id,
                            date: data.date,
                            items: data.items,
                            total: data.total
                        });
                    });
                    Storage.saveTransactions(transactions);
                    if (callback) callback(transactions);
                });
        }
        return null;
    }
};

// Initialize cloud storage
if (typeof window !== 'undefined') {
    // Wait for Firebase to load
    if (typeof firebase !== 'undefined') {
        CloudStorage.init();
    } else {
        // Try again after a delay
        setTimeout(() => {
            if (typeof firebase !== 'undefined') {
                CloudStorage.init();
            }
        }, 1000);
    }
}

