// localStorage utilities and data management

const Storage = {
    // Initialize default data if not exists
    init() {
        if (!localStorage.getItem('menuItems')) {
            const defaultMenuItems = [
                { id: '1', menuId: 'MENU001', name: 'Xerox', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop', defaultPrice: 2, stock: 1000 },
                { id: '2', menuId: 'MENU002', name: 'Passport size print', image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop', defaultPrice: 50, stock: 500 },
                { id: '3', menuId: 'MENU003', name: 'Maxi photo print', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244b32a?w=400&h=300&fit=crop', defaultPrice: 100, stock: 200 },
                { id: '4', menuId: 'MENU004', name: 'Printout', image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&h=300&fit=crop', defaultPrice: 5, stock: 2000 },
                { id: '5', menuId: 'MENU005', name: 'Colour print out', image: 'https://images.unsplash.com/photo-1611224923853-04b19e2e2b1d?w=400&h=300&fit=crop', defaultPrice: 10, stock: 1000 }
            ];
            this.saveMenuItems(defaultMenuItems);
        }

        if (!localStorage.getItem('cart')) {
            this.saveCart([]);
        }

        if (!localStorage.getItem('transactions')) {
            this.saveTransactions([]);
        }

        if (!localStorage.getItem('adminPassword')) {
            // Default password: admin123
            localStorage.setItem('adminPassword', 'admin123');
        }
    },

    // Menu Items
    getMenuItems() {
        const items = localStorage.getItem('menuItems');
        return items ? JSON.parse(items) : [];
    },

    saveMenuItems(items) {
        localStorage.setItem('menuItems', JSON.stringify(items));
    },

    addMenuItem(item) {
        const items = this.getMenuItems();
        // Generate unique Menu ID if not provided
        const menuId = item.menuId || this.generateMenuId();
        const newItem = {
            id: Date.now().toString(),
            menuId: menuId,
            name: item.name,
            image: item.image || 'https://via.placeholder.com/200x150?text=Item',
            defaultPrice: parseFloat(item.defaultPrice) || 0,
            stock: parseFloat(item.stock) || 0
        };
        items.push(newItem);
        this.saveMenuItems(items);
        return newItem;
    },

    generateMenuId() {
        const items = this.getMenuItems();
        let maxNum = 0;
        items.forEach(item => {
            if (item.menuId && item.menuId.startsWith('MENU')) {
                const num = parseInt(item.menuId.replace('MENU', ''));
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            }
        });
        return 'MENU' + String(maxNum + 1).padStart(3, '0');
    },

    updateMenuItem(id, updatedItem) {
        const items = this.getMenuItems();
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            const currentItem = items[index];
            const parsedPrice = (updatedItem && Object.prototype.hasOwnProperty.call(updatedItem, 'defaultPrice'))
                ? Number(updatedItem.defaultPrice)
                : currentItem.defaultPrice;
            const parsedStock = (updatedItem && Object.prototype.hasOwnProperty.call(updatedItem, 'stock'))
                ? Number(updatedItem.stock)
                : currentItem.stock;

            items[index] = {
                ...currentItem,
                menuId: updatedItem.menuId || currentItem.menuId,
                name: updatedItem.name || currentItem.name,
                image: updatedItem.image || currentItem.image,
                defaultPrice: Number.isFinite(parsedPrice) ? parsedPrice : currentItem.defaultPrice,
                stock: Number.isFinite(parsedStock) ? parsedStock : currentItem.stock
            };
            this.saveMenuItems(items);
            return items[index];
        }
        return null;
    },

    updateStock(identifier, quantity) {
        const items = this.getMenuItems();
        let item = items.find(i => i.menuId === identifier);
        if (!item) {
            item = items.find(i => i.id === identifier);
        }
        if (!item) {
            throw new Error(`Menu item "${identifier}" was not found`);
        }

        const numericQuantity = Number(quantity);
        if (!Number.isFinite(numericQuantity)) {
            throw new Error('Quantity must be a valid number');
        }

        const startingStock = Number(item.stock) || 0;
        item.stock = Math.max(0, startingStock + numericQuantity);
        this.saveMenuItems(items);
        return item;
    },

    deleteMenuItem(id) {
        const items = this.getMenuItems();
        const filtered = items.filter(item => item.id !== id);
        this.saveMenuItems(filtered);
        return filtered;
    },

    // Cart
    getCart() {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    },

    saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    },

    clearCart() {
        this.saveCart([]);
    },

    // Transactions
    getTransactions() {
        const transactions = localStorage.getItem('transactions');
        return transactions ? JSON.parse(transactions) : [];
    },

    saveTransactions(transactions) {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    },

    addTransaction(transaction) {
        const transactions = this.getTransactions();
        const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
        const newTransaction = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            items: transaction.items,
            total: transaction.total,
            discount: transaction.discount || 0,
            finalTotal: transaction.finalTotal || transaction.total,
            userId: currentUser ? currentUser.id : null,
            userName: currentUser ? currentUser.name : 'Unknown',
            userUsername: currentUser ? currentUser.username : 'unknown'
        };
        transactions.push(newTransaction);
        this.saveTransactions(transactions);
        return newTransaction;
    },

    // Admin
    checkPassword(password) {
        const storedPassword = localStorage.getItem('adminPassword');
        return password === storedPassword;
    },

    setPassword(password) {
        localStorage.setItem('adminPassword', password);
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    Storage.init();
}

