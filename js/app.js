// Main application logic

const App = {
    searchTerm: '',
    showBookmarksOnly: false,

    init() {
        this.renderMenu();
        Cart.init();
        this.setupQuantityModal();
        this.setupSearch();
        this.setupBookmarks();
    },

    setupSearch() {
        const searchInput = document.getElementById('menuSearch');
        const clearBtn = document.getElementById('clearSearchBtn');

        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase().trim();
            this.renderMenu();
            
            // Show/hide clear button
            if (this.searchTerm) {
                clearBtn.style.display = 'block';
            } else {
                clearBtn.style.display = 'none';
            }
        });

        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            this.searchTerm = '';
            clearBtn.style.display = 'none';
            this.renderMenu();
        });
    },

    setupBookmarks() {
        const bookmarksBtn = document.getElementById('showBookmarksBtn');
        if (bookmarksBtn) {
            bookmarksBtn.addEventListener('click', () => {
                this.showBookmarksOnly = !this.showBookmarksOnly;
                bookmarksBtn.textContent = this.showBookmarksOnly ? 'Show All' : '⭐ Bookmarks';
                bookmarksBtn.classList.toggle('active', this.showBookmarksOnly);
                this.renderMenu();
            });
        }
    },

    renderMenu() {
        let menuItems = Storage.getMenuItems();
        const menuGrid = document.getElementById('menuGrid');

        // Filter by bookmarks if enabled
        if (this.showBookmarksOnly) {
            const bookmarkedIds = Bookmarks.getBookmarks();
            menuItems = menuItems.filter(item => bookmarkedIds.includes(item.menuId));
        }

        // Filter menu items based on search term
        if (this.searchTerm) {
            menuItems = menuItems.filter(item => 
                item.name.toLowerCase().includes(this.searchTerm)
            );
        }

        if (menuItems.length === 0) {
            if (this.searchTerm) {
                menuGrid.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1; padding: 40px;">No items found matching your search.</p>';
            } else {
                menuGrid.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1;">No menu items available. Please add items from admin panel.</p>';
            }
            return;
        }

        menuGrid.innerHTML = menuItems.map(item => {
            const stock = item.stock || 0;
            const stockStatus = stock > 0 ? `<span style="font-size: 12px; color: ${stock < 10 ? '#e74c3c' : '#27ae60'};">Stock: ${stock}</span>` : '<span style="font-size: 12px; color: #e74c3c;">Out of Stock</span>';
            const isOutOfStock = stock <= 0;
            const isBookmarked = Bookmarks.isBookmarked(item.menuId);
            
            return `
            <div class="menu-item ${isOutOfStock ? 'out-of-stock' : ''}">
                <div class="menu-item-header" style="position: relative;">
                    <button class="bookmark-btn" onclick="App.toggleBookmark('${item.menuId}')" style="position: absolute; top: 5px; right: 5px; background: none; border: none; font-size: 24px; cursor: pointer; z-index: 10;">${isBookmarked ? '⭐' : '☆'}</button>
                    <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop'">
                </div>
                <h3>${item.name}</h3>
                <p class="price">₹${item.defaultPrice.toFixed(2)}</p>
                <p>${stockStatus}</p>
                <button onclick="App.addToCart('${item.id}')" ${isOutOfStock ? 'disabled' : ''}>${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</button>
            </div>
        `;
        }).join('');
    },

    toggleBookmark(menuId) {
        Bookmarks.toggleBookmark(menuId);
        this.renderMenu();
    },

    addToCart(itemId) {
        const menuItems = Storage.getMenuItems();
        const item = menuItems.find(menuItem => menuItem.id === itemId);

        if (!item) {
            alert('Item not found!');
            return;
        }

        // Check stock
        if ((item.stock || 0) <= 0) {
            alert('This item is out of stock!');
            return;
        }

        Cart.currentItem = item;
        this.showQuantityModal();
    },

    showQuantityModal() {
        const quantityInput = document.getElementById('quantityInput');
        quantityInput.value = 1;
        quantityInput.max = Cart.currentItem ? (Cart.currentItem.stock || 9999) : 9999;
        document.getElementById('quantityModal').classList.add('show');
    },

    closeQuantityModal() {
        document.getElementById('quantityModal').classList.remove('show');
        Cart.currentItem = null;
    },

    setupQuantityModal() {
        const quantityModal = document.getElementById('quantityModal');
        const addToCartBtn = document.getElementById('addToCartBtn');
        const cancelBtn = document.getElementById('cancelQuantityBtn');
        const closeBtn = quantityModal.querySelector('.close');

        addToCartBtn.addEventListener('click', () => {
            const quantity = parseInt(document.getElementById('quantityInput').value);
            if (quantity > 0 && Cart.currentItem) {
                Cart.addItem(Cart.currentItem, quantity);
                this.closeQuantityModal();
            } else {
                alert('Please enter a valid quantity!');
            }
        });

        cancelBtn.addEventListener('click', () => this.closeQuantityModal());
        closeBtn.addEventListener('click', () => this.closeQuantityModal());

        quantityModal.addEventListener('click', (e) => {
            if (e.target === quantityModal) {
                this.closeQuantityModal();
            }
        });

        // Close payment modal
        const paymentModal = document.getElementById('paymentModal');
        const paymentCloseBtn = paymentModal.querySelector('.close');
        paymentCloseBtn.addEventListener('click', () => Cart.closePaymentModal());
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) {
                Cart.closePaymentModal();
            }
        });

        // Allow Enter key to add to cart
        document.getElementById('quantityInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addToCartBtn.click();
            }
        });
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

