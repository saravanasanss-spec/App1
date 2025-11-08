// Main application logic

const App = {
    init() {
        this.renderMenu();
        Cart.init();
        this.setupQuantityModal();
    },

    renderMenu() {
        const menuItems = Storage.getMenuItems();
        const menuGrid = document.getElementById('menuGrid');

        if (menuItems.length === 0) {
            menuGrid.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1;">No menu items available. Please add items from admin panel.</p>';
            return;
        }

        menuGrid.innerHTML = menuItems.map(item => `
            <div class="menu-item">
                <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop'">
                <h3>${item.name}</h3>
                <p class="price">₹${item.defaultPrice.toFixed(2)}</p>
                <button onclick="App.addToCart('${item.id}')">Add to Cart</button>
            </div>
        `).join('');
    },

    addToCart(itemId) {
        const menuItems = Storage.getMenuItems();
        const item = menuItems.find(menuItem => menuItem.id === itemId);

        if (!item) {
            alert('Item not found!');
            return;
        }

        Cart.currentItem = item;
        this.showQuantityModal();
    },

    showQuantityModal() {
        document.getElementById('quantityInput').value = 1;
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

