// localStorage utilities and data management

const Storage = {
    // Initialize default data if not exists
    init() {
        if (!localStorage.getItem('menuItems')) {
            const defaultMenuItems = [
                { id: '1', name: 'Xerox', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop', defaultPrice: 2 },
                { id: '2', name: 'Passport size print', image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop', defaultPrice: 50 },
                { id: '3', name: 'Maxi photo print', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244b32a?w=400&h=300&fit=crop', defaultPrice: 100 },
                { id: '4', name: 'Printout', image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&h=300&fit=crop', defaultPrice: 5 },
                { id: '5', name: 'Colour print out', image: 'https://images.unsplash.com/photo-1611224923853-04b19e2e2b1d?w=400&h=300&fit=crop', defaultPrice: 10 }
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
        const newItem = {
            id: Date.now().toString(),
            name: item.name,
            image: item.image || 'https://via.placeholder.com/200x150?text=Item',
            defaultPrice: parseFloat(item.defaultPrice) || 0
        };
        items.push(newItem);
        this.saveMenuItems(items);
        return newItem;
    },

    updateMenuItem(id, updatedItem) {
        const items = this.getMenuItems();
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = {
                ...items[index],
                name: updatedItem.name || items[index].name,
                image: updatedItem.image || items[index].image,
                defaultPrice: parseFloat(updatedItem.defaultPrice) || items[index].defaultPrice
            };
            this.saveMenuItems(items);
            return items[index];
        }
        return null;
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
        const newTransaction = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            items: transaction.items,
            total: transaction.total
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

