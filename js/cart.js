// Cart and billing functionality

const Cart = {
    currentItem: null,

    init() {
        this.renderCart();
        this.setupEventListeners();
    },

    setupEventListeners() {
        document.getElementById('clearCartBtn').addEventListener('click', () => this.clearCart());
        document.getElementById('payNowBtn').addEventListener('click', () => this.showPaymentModal());
        document.getElementById('printBillBtn').addEventListener('click', () => this.printBill());
        document.getElementById('confirmPaymentBtn').addEventListener('click', () => this.confirmPayment());
        document.getElementById('cancelPaymentBtn').addEventListener('click', () => this.closePaymentModal());
    },

    addItem(item, quantity) {
        const cart = Storage.getCart();
        const existingItem = cart.find(cartItem => cartItem.itemId === item.id);

        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.total = existingItem.quantity * existingItem.price;
        } else {
            cart.push({
                itemId: item.id,
                name: item.name,
                quantity: quantity,
                price: item.defaultPrice,
                total: quantity * item.defaultPrice
            });
        }

        Storage.saveCart(cart);
        this.renderCart();
    },

    removeItem(itemId) {
        const cart = Storage.getCart();
        const filtered = cart.filter(item => item.itemId !== itemId);
        Storage.saveCart(filtered);
        this.renderCart();
    },

    updateQuantity(itemId, newQuantity) {
        if (newQuantity <= 0) {
            this.removeItem(itemId);
            return;
        }

        const cart = Storage.getCart();
        const item = cart.find(cartItem => cartItem.itemId === itemId);
        if (item) {
            item.quantity = parseInt(newQuantity);
            item.total = item.quantity * item.price;
            Storage.saveCart(cart);
            this.renderCart();
        }
    },

    clearCart() {
        if (Storage.getCart().length === 0) {
            alert('Cart is already empty!');
            return;
        }

        if (confirm('Are you sure you want to clear the cart?')) {
            Storage.clearCart();
            this.renderCart();
        }
    },

    getTotal() {
        const cart = Storage.getCart();
        return cart.reduce((sum, item) => sum + item.total, 0);
    },

    renderCart() {
        const cart = Storage.getCart();
        const cartItemsEl = document.getElementById('cartItems');
        const cartTotalEl = document.getElementById('cartTotal');

        if (cart.length === 0) {
            cartItemsEl.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            cartTotalEl.textContent = '0.00';
            return;
        }

        cartItemsEl.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>₹${item.price.toFixed(2)} per unit</p>
                </div>
                <div class="cart-item-actions">
                    <input 
                        type="number" 
                        value="${item.quantity}" 
                        min="1"
                        onchange="Cart.updateQuantity('${item.itemId}', this.value)"
                    >
                    <button onclick="Cart.removeItem('${item.itemId}')">Remove</button>
                </div>
                <div class="cart-item-total">
                    ₹${item.total.toFixed(2)}
                </div>
            </div>
        `).join('');

        cartTotalEl.textContent = this.getTotal().toFixed(2);
    },

    showPaymentModal() {
        const cart = Storage.getCart();
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const total = this.getTotal();
        document.getElementById('paymentTotal').textContent = total.toFixed(2);
        document.getElementById('paymentModal').classList.add('show');
    },

    closePaymentModal() {
        document.getElementById('paymentModal').classList.remove('show');
    },

    confirmPayment() {
        const cart = Storage.getCart();
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const total = this.getTotal();
        const transaction = {
            items: cart.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.total
            })),
            total: total
        };

        Storage.addTransaction(transaction);
        Storage.clearCart();
        this.renderCart();
        this.closePaymentModal();
        alert('Payment confirmed! Transaction saved.');
    },

    printBill() {
        const cart = Storage.getCart();
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const total = this.getTotal();
        const billItemsEl = document.getElementById('billItems');
        const billTotalEl = document.getElementById('billTotal');
        const billDateEl = document.getElementById('billDate');
        const billNumberEl = document.getElementById('billNumber');

        billItemsEl.innerHTML = cart.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${item.total.toFixed(2)}</td>
            </tr>
        `).join('');

        billTotalEl.textContent = total.toFixed(2);
        billDateEl.textContent = new Date().toLocaleString();
        billNumberEl.textContent = 'BILL-' + Date.now().toString().slice(-6);

        const billPrintEl = document.getElementById('billPrint');
        billPrintEl.style.display = 'block';

        window.print();

        setTimeout(() => {
            billPrintEl.style.display = 'none';
        }, 1000);
    }
};

