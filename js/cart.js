// Cart and billing functionality

const Cart = {
    currentItem: null,
    isProcessingPayment: false,

    init() {
        this.renderCart();
        this.setupEventListeners();
    },

    setupEventListeners() {
        document.getElementById('clearCartBtn').addEventListener('click', () => this.clearCart());
        document.getElementById('payNowBtn').addEventListener('click', () => this.handlePayNow());
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

        // Check stock availability
        const menuItems = Storage.getMenuItems();
        const menuItem = menuItems.find(m => m.id === itemId);
        if (menuItem && (menuItem.stock || 0) < newQuantity) {
            alert(`Insufficient stock! Available: ${menuItem.stock || 0}`);
            this.renderCart(); // Re-render to reset quantity
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
        const cartSubtotalEl = document.getElementById('cartSubtotal');
        const cartTotalEl = document.getElementById('cartTotal');
        const billDiscountInput = document.getElementById('billDiscount');

        if (cart.length === 0) {
            cartItemsEl.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            cartSubtotalEl.textContent = '0.00';
            cartTotalEl.textContent = '0.00';
            if (billDiscountInput) billDiscountInput.value = '0';
            return;
        }

        cartItemsEl.innerHTML = cart.map(item => {
            const menuItems = Storage.getMenuItems();
            const menuItem = menuItems.find(m => m.id === item.itemId);
            const stock = menuItem ? (menuItem.stock || 0) : null;
            const stockWarning = stock !== null && stock < item.quantity ? ' (Low Stock!)' : '';
            
            return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}${stockWarning}</h4>
                    <p>₹${item.price.toFixed(2)} per unit ${stock !== null ? `| Stock: ${stock}` : ''}</p>
                    ${item.discount > 0 ? `<p style="color: #27ae60; font-size: 12px;">Discount: ₹${item.discount.toFixed(2)}</p>` : ''}
                </div>
                <div class="cart-item-actions">
                    <input 
                        type="number" 
                        value="${item.quantity}" 
                        min="1"
                        max="${stock !== null ? stock : ''}"
                        onchange="Cart.updateQuantity('${item.itemId}', this.value)"
                    >
                    <button onclick="Cart.removeItem('${item.itemId}')">Remove</button>
                </div>
                <div class="cart-item-total">
                    ₹${item.total.toFixed(2)}
                </div>
            </div>
        `}).join('');

        const subtotal = this.getTotal();
        cartSubtotalEl.textContent = subtotal.toFixed(2);
        
        // Update total with discount
        if (billDiscountInput) {
            billDiscountInput.addEventListener('input', () => this.updateTotal());
            this.updateTotal();
        } else {
            cartTotalEl.textContent = subtotal.toFixed(2);
        }
    },

    updateTotal() {
        const subtotal = this.getTotal();
        const discount = parseFloat(document.getElementById('billDiscount')?.value || 0);
        const finalTotal = Math.max(0, subtotal - discount);
        document.getElementById('cartTotal').textContent = finalTotal.toFixed(2);
    },

    handlePayNow() {
        this.confirmPayment();
    },

    showPaymentModal() {
        // Legacy support: instead of showing QR modal, process payment directly.
        this.handlePayNow();
    },

    closePaymentModal() {
        document.getElementById('paymentModal').classList.remove('show');
    },

    async confirmPayment() {
        if (this.isProcessingPayment) {
            return;
        }

        const cart = Storage.getCart();
        if (cart.length === 0) {
            alert('Your cart is empty!');
            this.isProcessingPayment = false;
            return;
        }

        this.isProcessingPayment = true;
        const cloudSyncPromises = [];

        try {
            // Check stock availability and reduce stock
            const menuItems = Storage.getMenuItems();
            for (const cartItem of cart) {
                const menuItem = menuItems.find(m => m.id === cartItem.itemId || m.name === cartItem.name);
                if (menuItem) {
                    if ((menuItem.stock || 0) < cartItem.quantity) {
                        alert(`Insufficient stock for ${cartItem.name}. Available: ${menuItem.stock || 0}`);
                        this.isProcessingPayment = false;
                        return;
                    }
                    // Reduce stock locally
                    const updatedItem = Storage.updateStock(menuItem.menuId || menuItem.id, -cartItem.quantity);

                    // Sync stock to cloud if available
                    if (typeof CloudStorage !== 'undefined' && CloudStorage.isAvailable && updatedItem?.id) {
                        cloudSyncPromises.push(
                            CloudStorage.updateMenuItem(updatedItem.id, {
                                stock: updatedItem.stock,
                                updatedAt: new Date().toISOString()
                            }).catch(error => {
                                console.error('Error syncing stock to cloud:', error);
                            })
                        );
                    }
                    
                    // Save stock adjustment log
                    if (typeof StockAdjustment !== 'undefined') {
                        await StockAdjustment.logAdjustment({
                            menuId: menuItem.menuId || menuItem.id,
                            itemName: menuItem.name,
                            quantity: -cartItem.quantity,
                            reason: 'Billing - Sale',
                            adjustmentType: 'sale'
                        });
                    }
                }
            }

            if (cloudSyncPromises.length > 0) {
                await Promise.allSettled(cloudSyncPromises);
            }

            const total = this.getTotal();
            const discount = parseFloat(document.getElementById('billDiscount')?.value || 0);
            const finalTotal = Math.max(0, total - discount);

            const transaction = {
                items: cart.map(item => ({
                    menuId: menuItems.find(m => m.id === item.itemId)?.menuId || null,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total,
                    discount: item.discount || 0
                })),
                total: total,
                discount: discount,
                finalTotal: finalTotal
            };

            // Use cloud storage if available, otherwise localStorage
            if (typeof CloudStorage !== 'undefined' && CloudStorage.isAvailable) {
                try {
                    await CloudStorage.addTransaction(transaction);
                    Storage.clearCart();
                    this.renderCart();
                    this.closePaymentModal();
                    alert('Payment confirmed! Transaction saved to cloud.');
                } catch (error) {
                    console.error('Error saving transaction:', error);
                    Storage.addTransaction(transaction);
                    Storage.clearCart();
                    this.renderCart();
                    this.closePaymentModal();
                    alert('Payment confirmed! Transaction saved locally.');
                }
            } else {
                Storage.addTransaction(transaction);
                Storage.clearCart();
                this.renderCart();
                this.closePaymentModal();
                alert('Payment confirmed! Transaction saved.');
            }
            this.isProcessingPayment = false;
        } catch (error) {
            console.error('Error confirming payment:', error);
            alert('Error confirming payment. Please try again.');
            this.isProcessingPayment = false;
        }
    },

    printBill() {
        const cart = Storage.getCart();
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const subtotal = this.getTotal();
        const discount = parseFloat(document.getElementById('billDiscount')?.value || 0);
        const finalTotal = Math.max(0, subtotal - discount);
        const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
        
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

        // Add discount row if applicable
        if (discount > 0) {
            billItemsEl.innerHTML += `
                <tr style="border-top: 1px solid #333;">
                    <td colspan="3"><strong>Subtotal</strong></td>
                    <td><strong>₹${subtotal.toFixed(2)}</strong></td>
                </tr>
                <tr>
                    <td colspan="3"><strong>Discount</strong></td>
                    <td><strong>-₹${discount.toFixed(2)}</strong></td>
                </tr>
            `;
        }

        billTotalEl.textContent = finalTotal.toFixed(2);
        billDateEl.textContent = new Date().toLocaleString();
        billNumberEl.textContent = 'BILL-' + Date.now().toString().slice(-6);

        // Add billed by info if available
        const billFooter = document.querySelector('.bill-footer');
        if (currentUser && billFooter) {
            billFooter.innerHTML = `<p>Billed by: ${currentUser.name}</p><p>Thank you for your business!</p>`;
        }

        const billPrintEl = document.getElementById('billPrint');
        billPrintEl.style.display = 'block';

        window.print();

        setTimeout(() => {
            billPrintEl.style.display = 'none';
            if (billFooter) {
                billFooter.innerHTML = '<p>Thank you for your business!</p>';
            }
        }, 1000);
    }
};

