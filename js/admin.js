// Admin page logic

const Admin = {
    isAuthenticated: false,
    currentEditId: null,
    currentFilter: null,
    dateRangeFilter: { from: null, to: null },
    menuItemFilter: null,

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.setupTabs();
        // populateMenuItemFilter will be called when reports tab is accessed
    },

    checkAuth() {
        // Check if already authenticated (simple check)
        const auth = sessionStorage.getItem('adminAuth');
        if (auth === 'true') {
            this.showAdminPanel();
        } else {
            this.showPasswordModal();
        }
    },

    showPasswordModal() {
        document.getElementById('passwordModal').classList.add('show');
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('passwordInput').focus();
    },

    showAdminPanel() {
        document.getElementById('passwordModal').classList.remove('show');
        document.getElementById('adminPanel').style.display = 'block';
        this.isAuthenticated = true;
        this.renderMenu();
        this.renderReports();
    },

    authenticate() {
        const password = document.getElementById('passwordInput').value;
        const errorEl = document.getElementById('passwordError');

        if (Storage.checkPassword(password)) {
            sessionStorage.setItem('adminAuth', 'true');
            this.showAdminPanel();
            errorEl.classList.remove('show');
            document.getElementById('passwordInput').value = '';
        } else {
            errorEl.textContent = 'Incorrect password!';
            errorEl.classList.add('show');
            document.getElementById('passwordInput').value = '';
        }
    },

    logout() {
        sessionStorage.removeItem('adminAuth');
        this.isAuthenticated = false;
        this.showPasswordModal();
    },

    setupEventListeners() {
        // Password modal
        document.getElementById('loginBtn').addEventListener('click', () => this.authenticate());
        document.getElementById('passwordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.authenticate();
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Menu management
        document.getElementById('addItemBtn').addEventListener('click', () => this.showItemModal());
        document.getElementById('cancelItemBtn').addEventListener('click', () => this.closeItemModal());
        document.getElementById('itemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveItem();
        });

        // Reports
        document.getElementById('filterMenuItemBtn').addEventListener('click', () => this.filterByMenuItem());
        document.getElementById('filterBtn').addEventListener('click', () => this.filterReports());
        document.getElementById('filterDateRangeBtn').addEventListener('click', () => this.filterByDateRange());
        document.getElementById('clearFilterBtn').addEventListener('click', () => {
            this.currentFilter = null;
            this.dateRangeFilter = { from: null, to: null };
            this.menuItemFilter = null;
            document.getElementById('monthFilter').value = '';
            document.getElementById('dateFrom').value = '';
            document.getElementById('dateTo').value = '';
            document.getElementById('menuItemFilter').value = '';
            this.renderReports();
        });

        // Close modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('show');
                    if (modal.id === 'itemModal') {
                        this.closeItemModal();
                    }
                }
            });
        });

        // Close modal on outside click
        document.getElementById('itemModal').addEventListener('click', (e) => {
            if (e.target.id === 'itemModal') {
                this.closeItemModal();
            }
        });
    },

    setupTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });
    },

    switchTab(tabName) {
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        // Populate menu items when switching to reports tab
        if (tabName === 'reports') {
            this.populateMenuItemFilter();
        }
    },

    populateMenuItemFilter() {
        const menuItems = Storage.getMenuItems();
        const select = document.getElementById('menuItemFilter');
        
        if (select) {
            // Clear existing options except "All Items"
            select.innerHTML = '<option value="">All Items</option>';
            
            // Add menu items
            menuItems.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                // Preserve selected value if menu item filter is active
                if (this.menuItemFilter === item.name) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        }
    },

    // Menu Management
    renderMenu() {
        const menuItems = Storage.getMenuItems();
        const menuList = document.getElementById('menuList');

        if (menuItems.length === 0) {
            menuList.innerHTML = '<div class="empty-state"><p>No menu items. Click "Add New Item" to get started.</p></div>';
            return;
        }

        menuList.innerHTML = menuItems.map(item => `
            <div class="menu-item-card">
                <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop'">
                <div class="menu-item-info">
                    <h3>${item.name}</h3>
                    <p><strong>Price:</strong> ₹${item.defaultPrice.toFixed(2)}</p>
                </div>
                <div class="menu-item-actions">
                    <button class="btn btn-success" onclick="Admin.editItem('${item.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="Admin.deleteItem('${item.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    },

    showItemModal(itemId = null) {
        const modal = document.getElementById('itemModal');
        const form = document.getElementById('itemForm');
        const title = document.getElementById('modalTitle');

        if (itemId) {
            // Edit mode
            this.currentEditId = itemId;
            const item = Storage.getMenuItems().find(i => i.id === itemId);
            if (item) {
                document.getElementById('itemName').value = item.name;
                document.getElementById('itemImage').value = item.image;
                document.getElementById('itemPrice').value = item.defaultPrice;
                title.textContent = 'Edit Menu Item';
            }
        } else {
            // Add mode
            this.currentEditId = null;
            form.reset();
            title.textContent = 'Add Menu Item';
        }

        modal.classList.add('show');
    },

    closeItemModal() {
        document.getElementById('itemModal').classList.remove('show');
        document.getElementById('itemForm').reset();
        this.currentEditId = null;
    },

    saveItem() {
        const name = document.getElementById('itemName').value.trim();
        const image = document.getElementById('itemImage').value.trim();
        const price = parseFloat(document.getElementById('itemPrice').value);

        if (!name || !price || price < 0) {
            alert('Please fill in all fields correctly!');
            return;
        }

        if (this.currentEditId) {
            // Update existing item
            Storage.updateMenuItem(this.currentEditId, {
                name: name,
                image: image || 'https://via.placeholder.com/200x150?text=' + encodeURIComponent(name),
                defaultPrice: price
            });
        } else {
            // Add new item
            Storage.addMenuItem({
                name: name,
                image: image || 'https://via.placeholder.com/200x150?text=' + encodeURIComponent(name),
                defaultPrice: price
            });
        }

        this.closeItemModal();
        this.renderMenu();
        this.populateMenuItemFilter(); // Update menu filter dropdown
        alert('Item saved successfully!');
    },

    editItem(itemId) {
        this.showItemModal(itemId);
    },

    deleteItem(itemId) {
        const item = Storage.getMenuItems().find(i => i.id === itemId);
        if (!item) return;

        if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
            Storage.deleteMenuItem(itemId);
            this.renderMenu();
            this.populateMenuItemFilter(); // Update menu filter dropdown
            alert('Item deleted successfully!');
        }
    },

    // Reports
    renderReports() {
        this.renderReportSummary();
        this.renderTransactions();
    },

    renderReportSummary() {
        const transactions = this.getFilteredTransactions();
        const summaryEl = document.getElementById('reportSummary');

        if (transactions.length === 0) {
            summaryEl.innerHTML = '<div class="empty-state"><p>No transactions found for the selected period.</p></div>';
            return;
        }

        const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
        const totalItems = transactions.reduce((sum, t) => {
            return sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
        }, 0);
        const totalTransactions = transactions.length;

        // Item-wise summary
        const itemSummary = {};
        transactions.forEach(t => {
            t.items.forEach(item => {
                if (!itemSummary[item.name]) {
                    itemSummary[item.name] = { quantity: 0, revenue: 0 };
                }
                itemSummary[item.name].quantity += item.quantity;
                itemSummary[item.name].revenue += item.total;
            });
        });

        let filterText = ' (All Time)';
        const filterParts = [];
        
        if (this.dateRangeFilter.from && this.dateRangeFilter.to) {
            const fromDate = new Date(this.dateRangeFilter.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const toDate = new Date(this.dateRangeFilter.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            filterParts.push(`from ${fromDate} to ${toDate}`);
        } else if (this.currentFilter) {
            filterParts.push(`for ${new Date(this.currentFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
        }
        
        if (this.menuItemFilter) {
            filterParts.push(`for "${this.menuItemFilter}"`);
        }
        
        if (filterParts.length > 0) {
            filterText = ' ' + filterParts.join(' and ');
        }

        summaryEl.innerHTML = `
            <h3>Sales Summary${filterText}</h3>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Total Sales</h3>
                    <p>₹${totalSales.toFixed(2)}</p>
                </div>
                <div class="summary-card">
                    <h3>Total Transactions</h3>
                    <p>${totalTransactions}</p>
                </div>
                <div class="summary-card">
                    <h3>Total Items Sold</h3>
                    <p>${totalItems}</p>
                </div>
            </div>
            ${Object.keys(itemSummary).length > 0 ? `
                <h4 style="margin-top: 20px; color: #333;">Item-wise Summary:</h4>
                <div style="margin-top: 15px;">
                    ${Object.entries(itemSummary).map(([name, data]) => `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                            <span><strong>${name}</strong></span>
                            <span>Qty: ${data.quantity} | Revenue: ₹${data.revenue.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    },

    renderTransactions() {
        const transactions = this.getFilteredTransactions();
        const transactionsList = document.getElementById('transactionsList');

        if (transactions.length === 0) {
            transactionsList.innerHTML = '<div class="empty-state"><p>No transactions found for the selected period.</p></div>';
            return;
        }

        transactionsList.innerHTML = transactions.map(transaction => {
            const date = new Date(transaction.date);
            return `
                <div class="transaction-card">
                    <div class="transaction-header">
                        <h3>Transaction #${transaction.id.slice(-6)}</h3>
                        <span class="transaction-date">${date.toLocaleString()}</span>
                    </div>
                    <div class="transaction-items">
                        ${transaction.items.map(item => `
                            <div class="transaction-item">
                                <span>${item.name} (${item.quantity} × ₹${item.price.toFixed(2)})</span>
                                <span>₹${item.total.toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="transaction-total">
                        Total: ₹${transaction.total.toFixed(2)}
                    </div>
                </div>
            `;
        }).join('');
    },

    getFilteredTransactions() {
        let transactions = Storage.getTransactions();

        // Apply date filters
        if (this.dateRangeFilter.from && this.dateRangeFilter.to) {
            const fromDate = new Date(this.dateRangeFilter.from);
            const toDate = new Date(this.dateRangeFilter.to);
            // Set to end of day for 'to' date
            toDate.setHours(23, 59, 59, 999);
            
            transactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= fromDate && transactionDate <= toDate;
            });
        } else if (this.currentFilter) {
            // Month filter
            const [year, month] = this.currentFilter.split('-');
            transactions = transactions.filter(t => {
                const date = new Date(t.date);
                return date.getFullYear() == year && (date.getMonth() + 1) == month;
            });
        }

        // Apply menu item filter (works with date filters)
        if (this.menuItemFilter) {
            transactions = transactions.filter(t => {
                // Check if any item in the transaction matches the filter
                return t.items.some(item => item.name === this.menuItemFilter);
            });
        }

        // Sort by date (newest first)
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    filterReports() {
        const monthValue = document.getElementById('monthFilter').value;
        if (monthValue) {
            this.currentFilter = monthValue;
            this.dateRangeFilter = { from: null, to: null }; // Clear date range when using month filter
            document.getElementById('dateFrom').value = '';
            document.getElementById('dateTo').value = '';
            this.renderReports();
        } else {
            alert('Please select a month!');
        }
    },

    filterByDateRange() {
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;
        
        if (!dateFrom || !dateTo) {
            alert('Please select both "Date From" and "Date To"!');
            return;
        }

        if (new Date(dateFrom) > new Date(dateTo)) {
            alert('"Date From" cannot be later than "Date To"!');
            return;
        }

        this.dateRangeFilter = { from: dateFrom, to: dateTo };
        this.currentFilter = null; // Clear month filter when using date range
        document.getElementById('monthFilter').value = '';
        this.renderReports();
    },

    filterByMenuItem() {
        const menuItemValue = document.getElementById('menuItemFilter').value;
        
        if (!menuItemValue) {
            // If "All Items" is selected, clear the filter
            this.menuItemFilter = null;
        } else {
            this.menuItemFilter = menuItemValue;
        }
        
        this.renderReports();
    }
};

// Initialize admin when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Admin.init();
});

