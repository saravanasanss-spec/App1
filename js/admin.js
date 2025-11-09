// Admin page logic

const Admin = {
    isAuthenticated: false,
    currentEditId: null,
    currentFilter: null,
    dateRangeFilter: { from: null, to: null },
    menuItemFilter: null,
    uploadedImageData: null,

    init() {
        // Check authentication using Auth system
        if (typeof Auth !== 'undefined') {
            if (!Auth.checkAuth()) {
                window.location.href = 'login.html';
                return;
            }
            const user = Auth.getCurrentUser();
            if (user) {
                const adminUserInfo = document.getElementById('adminUserInfo');
                if (adminUserInfo) {
                    adminUserInfo.textContent = `Welcome, ${user.name}`;
                }
            }
        }
        this.setupEventListeners();
        this.setupTabs();
        // Initialize cloud storage if available
        if (typeof CloudStorage !== 'undefined') {
            CloudStorage.init();
        }
        // Load menu items from cloud
        this.loadMenuFromCloud();
        this.renderMenu();
        this.renderReports().catch(console.error);
    },

    async loadMenuFromCloud() {
        if (typeof CloudStorage !== 'undefined' && CloudStorage.isAvailable) {
            try {
                await CloudStorage.getMenuItems();
                this.renderMenu();
            } catch (error) {
                console.error('Error loading menu from cloud:', error);
            }
        }
    },

    setupEventListeners() {
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && typeof Auth !== 'undefined') {
            logoutBtn.addEventListener('click', () => {
                Auth.logout();
            });
        }

        // Menu management
        document.getElementById('addItemBtn').addEventListener('click', () => this.showItemModal());
        document.getElementById('cancelItemBtn').addEventListener('click', () => this.closeItemModal());
        document.getElementById('itemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveItem();
        });

        // Image upload handling
        document.getElementById('imageFile').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('itemImage').addEventListener('input', (e) => this.handleImageUrl(e));

        // CSV upload handling
        document.getElementById('csvUpload').addEventListener('change', (e) => this.handleCsvUpload(e));

        // User management
        document.getElementById('addUserBtn').addEventListener('click', () => this.showUserModal());
        document.getElementById('cancelUserBtn').addEventListener('click', () => this.closeUserModal());
        document.getElementById('userForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUser();
        });

        // Stock adjustment
        document.getElementById('adjustStockBtn').addEventListener('click', () => {
            const form = document.getElementById('adjustmentForm');
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        });
        document.getElementById('cancelAdjustmentBtn').addEventListener('click', () => {
            document.getElementById('adjustmentForm').style.display = 'none';
            document.getElementById('stockAdjustmentForm').reset();
        });
        document.getElementById('stockAdjustmentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveStockAdjustment();
        });

        // Expense management
        document.getElementById('addExpenseBtn').addEventListener('click', () => {
            const form = document.getElementById('expenseForm');
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        });
        document.getElementById('cancelExpenseBtn').addEventListener('click', () => {
            document.getElementById('expenseForm').style.display = 'none';
            document.getElementById('expenseFormElement').reset();
        });
        document.getElementById('expenseFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveExpense();
        });

        // Close user modal
        document.getElementById('userModal').addEventListener('click', (e) => {
            if (e.target.id === 'userModal') {
                this.closeUserModal();
            }
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
            this.renderReports().catch(console.error);
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
            this.renderReports().catch(console.error);
        } else if (tabName === 'users') {
            this.renderUsers();
        } else if (tabName === 'inventory') {
            this.populateAdjustmentMenu();
            this.renderAdjustments();
        } else if (tabName === 'expenses') {
            this.renderExpenses();
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
                    <p><strong>Menu ID:</strong> ${item.menuId || 'N/A'}</p>
                    <p><strong>Price:</strong> ₹${item.defaultPrice.toFixed(2)}</p>
                    <p><strong>Stock:</strong> ${item.stock || 0} ${(item.stock || 0) < 10 ? '<span style="color: red;">(Low Stock!)</span>' : ''}</p>
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

        // Reset image upload
        this.uploadedImageData = null;
        document.getElementById('imageFile').value = '';
        this.updateImagePreview(null);

        if (itemId) {
            // Edit mode
            this.currentEditId = itemId;
            const item = Storage.getMenuItems().find(i => i.id === itemId);
            if (item) {
                document.getElementById('itemName').value = item.name;
                document.getElementById('itemImage').value = item.image;
                document.getElementById('itemPrice').value = item.defaultPrice;
                document.getElementById('itemStock').value = item.stock || 0;
                document.getElementById('itemMenuId').value = item.menuId || '';
                title.textContent = 'Edit Menu Item';
                // Show existing image preview
                this.updateImagePreview(item.image);
            }
        } else {
            // Add mode
            this.currentEditId = null;
            form.reset();
            title.textContent = 'Add Menu Item';
            // Clear stock and menuId for new items
            document.getElementById('itemStock').value = '0';
            document.getElementById('itemMenuId').value = '';
        }

        modal.classList.add('show');
    },

    closeItemModal() {
        document.getElementById('itemModal').classList.remove('show');
        document.getElementById('itemForm').reset();
        document.getElementById('imageFile').value = '';
        this.uploadedImageData = null;
        this.updateImagePreview(null);
        this.currentEditId = null;
    },

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file!');
            event.target.value = '';
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB!');
            event.target.value = '';
            return;
        }

        // Clear URL input when file is selected
        document.getElementById('itemImage').value = '';

        // Read file as base64
        const reader = new FileReader();
        reader.onload = (e) => {
            this.uploadedImageData = e.target.result;
            this.updateImagePreview(this.uploadedImageData);
        };
        reader.onerror = () => {
            alert('Error reading image file!');
            event.target.value = '';
        };
        reader.readAsDataURL(file);
    },

    handleImageUrl(event) {
        const url = event.target.value.trim();
        if (url) {
            // Clear uploaded image when URL is entered
            this.uploadedImageData = null;
            document.getElementById('imageFile').value = '';
            this.updateImagePreview(url);
        } else {
            this.updateImagePreview(null);
        }
    },

    updateImagePreview(imageSrc) {
        const preview = document.getElementById('imagePreview');
        if (imageSrc) {
            preview.innerHTML = `<img src="${imageSrc}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
        } else {
            preview.innerHTML = '<p class="preview-placeholder">No image selected</p>';
        }
    },

    saveItem() {
        const name = document.getElementById('itemName').value.trim();
        const imageUrl = document.getElementById('itemImage').value.trim();
        const price = parseFloat(document.getElementById('itemPrice').value);
        const stock = parseFloat(document.getElementById('itemStock').value) || 0;
        const menuId = document.getElementById('itemMenuId').value.trim();

        if (!name || !price || price < 0) {
            alert('Please fill in all fields correctly!');
            return;
        }

        // Use uploaded image if available, otherwise use URL, otherwise use placeholder
        let finalImage = this.uploadedImageData || imageUrl;
        if (!finalImage) {
            finalImage = 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop';
        }

        const itemData = {
            name: name,
            image: finalImage,
            defaultPrice: price,
            stock: stock
        };

        if (menuId) {
            itemData.menuId = menuId;
        }

        if (this.currentEditId) {
            // Update existing item
            Storage.updateMenuItem(this.currentEditId, itemData);
        } else {
            // Add new item
            Storage.addMenuItem(itemData);
        }

        // Sync to cloud
        if (typeof CloudStorage !== 'undefined' && CloudStorage.isAvailable) {
            CloudStorage.saveMenuItems(Storage.getMenuItems()).catch(console.error);
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

    handleCsvUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.csv')) {
            alert('Please select a CSV file!');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const items = this.parseCSV(csv);
                
                if (items.length === 0) {
                    alert('No valid items found in CSV file!');
                    event.target.value = '';
                    return;
                }

                // Ask user if they want to replace or append
                const action = confirm(
                    `Found ${items.length} item(s) in CSV.\n\n` +
                    `Click OK to ADD these items to existing menu.\n` +
                    `Click Cancel to REPLACE all existing items.`
                );

                if (action) {
                    // Append items
                    items.forEach(item => {
                        Storage.addMenuItem(item);
                    });
                    alert(`Successfully added ${items.length} item(s) to menu!`);
                } else {
                    // Replace all items
                    if (confirm('Are you sure you want to replace ALL existing menu items? This cannot be undone!')) {
                        Storage.saveMenuItems(items.map((item, index) => ({
                            id: (Date.now() + index).toString() + Math.random().toString(36).substr(2, 9),
                            menuId: item.menuId || Storage.generateMenuId(),
                            name: item.name,
                            image: item.image || 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop',
                            defaultPrice: parseFloat(item.defaultPrice) || 0,
                            stock: parseFloat(item.stock) || 0
                        })));
                        alert(`Successfully replaced menu with ${items.length} item(s)!`);
                    } else {
                        event.target.value = '';
                        return;
                    }
                }

                // Sync to cloud
                if (typeof CloudStorage !== 'undefined' && CloudStorage.isAvailable) {
                    CloudStorage.saveMenuItems(Storage.getMenuItems()).catch(console.error);
                }

                this.renderMenu();
                this.populateMenuItemFilter();
            } catch (error) {
                alert('Error reading CSV file: ' + error.message);
                console.error(error);
            }
            event.target.value = '';
        };

        reader.onerror = () => {
            alert('Error reading CSV file!');
            event.target.value = '';
        };

        reader.readAsText(file);
    },

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV file must have at least a header row and one data row');
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Find column indices
        const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('item'));
        const priceIndex = headers.findIndex(h => h.includes('price') || h.includes('cost'));
        const imageIndex = headers.findIndex(h => h.includes('image') || h.includes('url') || h.includes('photo'));
        const stockIndex = headers.findIndex(h => h.includes('stock') || h.includes('quantity'));
        const menuIdIndex = headers.findIndex(h => h.includes('menuid') || h.includes('menu id'));

        if (nameIndex === -1 || priceIndex === -1) {
            throw new Error('CSV must have "name" and "price" columns');
        }

        // Parse data rows
        const items = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            
            if (values.length < Math.max(nameIndex, priceIndex) + 1) {
                continue; // Skip invalid rows
            }

            const name = values[nameIndex]?.trim();
            const price = values[priceIndex]?.trim();
            const image = imageIndex !== -1 ? values[imageIndex]?.trim() : '';
            const stock = stockIndex !== -1 ? values[stockIndex]?.trim() : '0';
            const menuId = menuIdIndex !== -1 ? values[menuIdIndex]?.trim() : '';

            if (name && price && !isNaN(parseFloat(price))) {
                const item = {
                    name: name,
                    defaultPrice: parseFloat(price),
                    image: image || '',
                    stock: parseFloat(stock) || 0
                };
                if (menuId) {
                    item.menuId = menuId;
                }
                items.push(item);
            }
        }

        return items;
    },

    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current); // Add last value

        return values.map(v => v.replace(/^"|"$/g, '').trim());
    },

    // Reports
    async renderReports() {
        // Refresh transactions from cloud
        if (typeof CloudStorage !== 'undefined' && CloudStorage.isAvailable) {
            try {
                await CloudStorage.getTransactions();
            } catch (error) {
                console.error('Error refreshing transactions:', error);
            }
        }
        await this.renderReportSummary();
        await this.renderTransactions();
    },

    async renderReportSummary() {
        const transactions = await this.getFilteredTransactions();
        const summaryEl = document.getElementById('reportSummary');

        if (transactions.length === 0) {
            summaryEl.innerHTML = '<div class="empty-state"><p>No transactions found for the selected period.</p></div>';
            return;
        }

        const totalSales = transactions.reduce((sum, t) => sum + (t.finalTotal || t.total), 0);
        const totalItems = transactions.reduce((sum, t) => {
            return sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
        }, 0);
        const totalTransactions = transactions.length;
        const totalDiscounts = transactions.reduce((sum, t) => sum + (t.discount || 0), 0);

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
                ${totalDiscounts > 0 ? `
                <div class="summary-card">
                    <h3>Total Discounts</h3>
                    <p>₹${totalDiscounts.toFixed(2)}</p>
                </div>
                ` : ''}
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

    async renderTransactions() {
        const transactions = await this.getFilteredTransactions();
        const transactionsList = document.getElementById('transactionsList');

        if (transactions.length === 0) {
            transactionsList.innerHTML = '<div class="empty-state"><p>No transactions found for the selected period.</p></div>';
            return;
        }

        transactionsList.innerHTML = transactions.map(transaction => {
            const date = new Date(transaction.date);
            const discount = transaction.discount || 0;
            const finalTotal = transaction.finalTotal || transaction.total;
            return `
                <div class="transaction-card">
                    <div class="transaction-header">
                        <h3>Transaction #${transaction.id.slice(-6)}</h3>
                        <span class="transaction-date">${date.toLocaleString()}</span>
                    </div>
                    <div class="transaction-items">
                        ${transaction.items.map(item => `
                            <div class="transaction-item">
                                <span>${item.name} (${item.quantity} × ₹${item.price.toFixed(2)})${item.discount > 0 ? ` - Discount: ₹${item.discount.toFixed(2)}` : ''}</span>
                                <span>₹${item.total.toFixed(2)}</span>
                            </div>
                        `).join('')}
                        ${discount > 0 ? `
                            <div class="transaction-item" style="border-top: 1px solid #eee; padding-top: 8px;">
                                <span><strong>Subtotal:</strong></span>
                                <span>₹${transaction.total.toFixed(2)}</span>
                            </div>
                            <div class="transaction-item">
                                <span><strong>Discount:</strong></span>
                                <span style="color: #27ae60;">-₹${discount.toFixed(2)}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="transaction-total">
                        Total: ₹${finalTotal.toFixed(2)}
                    </div>
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                        <p>Billed by: ${transaction.userName || 'Unknown'} (${transaction.userUsername || 'unknown'})</p>
                    </div>
                </div>
            `;
        }).join('');
    },

    async getFilteredTransactions() {
        let transactions = [];
        
        // Try to get from cloud storage first
        if (typeof CloudStorage !== 'undefined' && CloudStorage.isAvailable) {
            try {
                transactions = await CloudStorage.getTransactions();
            } catch (error) {
                console.error('Error fetching from cloud:', error);
                transactions = Storage.getTransactions();
            }
        } else {
            transactions = Storage.getTransactions();
        }

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
        this.renderReports().catch(console.error);
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
        this.renderReports().catch(console.error);
    },

    filterByMenuItem() {
        const menuItemValue = document.getElementById('menuItemFilter').value;
        
        if (!menuItemValue) {
            // If "All Items" is selected, clear the filter
            this.menuItemFilter = null;
        } else {
            this.menuItemFilter = menuItemValue;
        }
        
        this.renderReports().catch(console.error);
    },

    // User Management
    async renderUsers() {
        const usersList = document.getElementById('usersList');
        try {
            const users = await Auth.getUsers();
            if (users.length === 0) {
                usersList.innerHTML = '<div class="empty-state"><p>No users found. Click "Add New User" to create one.</p></div>';
                return;
            }

            usersList.innerHTML = users.map(user => `
                <div class="menu-item-card">
                    <div class="menu-item-info">
                        <h3>${user.name}</h3>
                        <p><strong>Username:</strong> ${user.username}</p>
                        <p><strong>Role:</strong> ${user.role || 'user'}</p>
                        <p><strong>Status:</strong> ${user.isActive !== false ? '<span style="color: green;">Active</span>' : '<span style="color: red;">Inactive</span>'}</p>
                        <p><strong>Created:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="menu-item-actions">
                        ${user.id !== Auth.getCurrentUser()?.id ? `
                            <button class="btn btn-danger" onclick="Admin.deleteUserConfirm('${user.id}')">Deactivate</button>
                        ` : '<p style="color: #666; font-size: 12px;">Current User</p>'}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error rendering users:', error);
            usersList.innerHTML = '<div class="empty-state"><p>Error loading users.</p></div>';
        }
    },

    showUserModal() {
        document.getElementById('userModal').classList.add('show');
        document.getElementById('userForm').reset();
    },

    closeUserModal() {
        document.getElementById('userModal').classList.remove('show');
        document.getElementById('userForm').reset();
    },

    async saveUser() {
        const name = document.getElementById('userName').value.trim();
        const username = document.getElementById('userUsername').value.trim();
        const password = document.getElementById('userPassword').value;
        const role = document.getElementById('userRole').value;

        if (!name || !username || !password) {
            alert('Please fill in all fields!');
            return;
        }

        try {
            await Auth.createUser({ name, username, password, role });
            this.closeUserModal();
            this.renderUsers();
            alert('User created successfully!');
        } catch (error) {
            alert('Error creating user: ' + error.message);
        }
    },

    async deleteUserConfirm(userId) {
        if (confirm('Are you sure you want to deactivate this user?')) {
            try {
                await Auth.deleteUser(userId);
                this.renderUsers();
                alert('User deactivated successfully!');
            } catch (error) {
                alert('Error deactivating user: ' + error.message);
            }
        }
    },

    // Stock Adjustment
    populateAdjustmentMenu() {
        const select = document.getElementById('adjustMenuItem');
        const menuItems = Storage.getMenuItems();
        select.innerHTML = '<option value="">Select item...</option>';
        menuItems.forEach(item => {
            const option = document.createElement('option');
            option.value = item.menuId;
            option.textContent = `${item.menuId} - ${item.name} (Stock: ${item.stock || 0})`;
            select.appendChild(option);
        });
    },

    async saveStockAdjustment() {
        const menuId = document.getElementById('adjustMenuItem').value;
        const quantity = parseInt(document.getElementById('adjustQuantity').value);
        const reason = document.getElementById('adjustReason').value.trim();

        if (!menuId || !quantity || !reason) {
            alert('Please fill in all fields!');
            return;
        }

        try {
            await StockAdjustment.adjustStock(menuId, quantity, reason);
            document.getElementById('stockAdjustmentForm').reset();
            document.getElementById('adjustmentForm').style.display = 'none';
            this.renderAdjustments();
            this.populateAdjustmentMenu();
            this.renderMenu(); // Refresh menu to show updated stock
            alert('Stock adjusted successfully!');
        } catch (error) {
            alert('Error adjusting stock: ' + error.message);
        }
    },

    async renderAdjustments() {
        const adjustmentsList = document.getElementById('adjustmentsList');
        try {
            const adjustments = await StockAdjustment.getAdjustments();
            if (adjustments.length === 0) {
                adjustmentsList.innerHTML = '<div class="empty-state"><p>No stock adjustments found.</p></div>';
                return;
            }

            adjustmentsList.innerHTML = adjustments.map(adj => {
                const date = new Date(adj.date);
                const quantityColor = adj.quantity > 0 ? 'green' : 'red';
                return `
                    <div class="transaction-card">
                        <div class="transaction-header">
                            <h3>${adj.itemName}</h3>
                            <span class="transaction-date">${date.toLocaleString()}</span>
                        </div>
                        <div class="transaction-items">
                            <div class="transaction-item">
                                <span><strong>Menu ID:</strong> ${adj.menuId}</span>
                                <span></span>
                            </div>
                            <div class="transaction-item">
                                <span><strong>Quantity Change:</strong></span>
                                <span style="color: ${quantityColor}; font-weight: bold;">${adj.quantity > 0 ? '+' : ''}${adj.quantity}</span>
                            </div>
                            <div class="transaction-item">
                                <span><strong>Reason:</strong> ${adj.reason}</span>
                                <span></span>
                            </div>
                            <div class="transaction-item">
                                <span><strong>Adjusted by:</strong> ${adj.userName} (${adj.userUsername})</span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error rendering adjustments:', error);
            adjustmentsList.innerHTML = '<div class="empty-state"><p>Error loading adjustments.</p></div>';
        }
    },

    // Expense Management
    async saveExpense() {
        const personName = document.getElementById('expensePerson').value.trim();
        const purpose = document.getElementById('expensePurpose').value.trim();
        const amount = parseFloat(document.getElementById('expenseAmount').value);

        if (!personName || !purpose || !amount || amount <= 0) {
            alert('Please fill in all fields correctly!');
            return;
        }

        try {
            await Expense.addExpense({ personName, purpose, amount });
            document.getElementById('expenseFormElement').reset();
            document.getElementById('expenseForm').style.display = 'none';
            this.renderExpenses();
            alert('Expense saved successfully!');
        } catch (error) {
            alert('Error saving expense: ' + error.message);
        }
    },

    async renderExpenses() {
        const expensesList = document.getElementById('expensesList');
        try {
            const expenses = await Expense.getExpenses();
            if (expenses.length === 0) {
                expensesList.innerHTML = '<div class="empty-state"><p>No expenses found. Click "Add Expense" to add one.</p></div>';
                return;
            }

            const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

            expensesList.innerHTML = `
                <div class="report-summary" style="margin-bottom: 20px;">
                    <h3>Expense Summary</h3>
                    <div class="summary-grid">
                        <div class="summary-card">
                            <h3>Total Expenses</h3>
                            <p>₹${totalExpenses.toFixed(2)}</p>
                        </div>
                        <div class="summary-card">
                            <h3>Total Records</h3>
                            <p>${expenses.length}</p>
                        </div>
                    </div>
                </div>
                ${expenses.map(expense => {
                    const date = new Date(expense.date);
                    return `
                        <div class="transaction-card">
                            <div class="transaction-header">
                                <h3>${expense.personName}</h3>
                                <span class="transaction-date">${date.toLocaleString()}</span>
                            </div>
                            <div class="transaction-items">
                                <div class="transaction-item">
                                    <span><strong>Purpose:</strong> ${expense.purpose}</span>
                                    <span></span>
                                </div>
                                <div class="transaction-item">
                                    <span><strong>Amount:</strong></span>
                                    <span style="color: #e74c3c; font-weight: bold;">₹${expense.amount.toFixed(2)}</span>
                                </div>
                                <div class="transaction-item">
                                    <span><strong>Recorded by:</strong> ${expense.userName}</span>
                                    <span></span>
                                </div>
                            </div>
                            <div class="transaction-total" style="text-align: right;">
                                <button class="btn btn-danger" onclick="Admin.deleteExpense('${expense.id}')" style="padding: 5px 10px; font-size: 12px;">Delete</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            `;
        } catch (error) {
            console.error('Error rendering expenses:', error);
            expensesList.innerHTML = '<div class="empty-state"><p>Error loading expenses.</p></div>';
        }
    },

    async deleteExpense(expenseId) {
        if (confirm('Are you sure you want to delete this expense?')) {
            try {
                await Expense.deleteExpense(expenseId);
                this.renderExpenses();
                alert('Expense deleted successfully!');
            } catch (error) {
                alert('Error deleting expense: ' + error.message);
            }
        }
    }
};

// Initialize admin when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Admin.init();
});

