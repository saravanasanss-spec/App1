// Expense Management

const Expense = {
    init() {
        if (!localStorage.getItem('expenses')) {
            localStorage.setItem('expenses', JSON.stringify([]));
        }
    },

    // Add expense
    async addExpense(expenseData) {
        const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
        const expense = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            personName: expenseData.personName,
            purpose: expenseData.purpose,
            amount: parseFloat(expenseData.amount),
            date: new Date().toISOString(),
            userId: currentUser ? currentUser.id : null,
            userName: currentUser ? currentUser.name : 'Unknown',
            userUsername: currentUser ? currentUser.username : 'unknown',
            createdAt: new Date().toISOString()
        };

        // Save to cloud
        if (typeof CloudStorage !== 'undefined' && CloudStorage.isAvailable && db) {
            try {
                await db.collection('expenses').doc(expense.id).set(expense);
            } catch (error) {
                console.error('Error saving expense to cloud:', error);
            }
        }

        // Save to localStorage
        const expenses = this.getExpensesLocal();
        expenses.push(expense);
        localStorage.setItem('expenses', JSON.stringify(expenses));

        return expense;
    },

    // Get all expenses
    async getExpenses() {
        if (typeof CloudStorage !== 'undefined' && CloudStorage.isAvailable && db) {
            try {
                const snapshot = await db.collection('expenses')
                    .orderBy('date', 'desc')
                    .get();
                
                const expenses = [];
                snapshot.forEach(doc => {
                    expenses.push(doc.data());
                });

                // Sync to localStorage
                localStorage.setItem('expenses', JSON.stringify(expenses));
                return expenses;
            } catch (error) {
                console.error('Error fetching expenses from cloud:', error);
                return this.getExpensesLocal();
            }
        } else {
            return this.getExpensesLocal();
        }
    },

    getExpensesLocal() {
        const expenses = localStorage.getItem('expenses');
        return expenses ? JSON.parse(expenses) : [];
    },

    // Delete expense
    async deleteExpense(expenseId) {
        if (typeof CloudStorage !== 'undefined' && CloudStorage.isAvailable && db) {
            try {
                await db.collection('expenses').doc(expenseId).delete();
            } catch (error) {
                console.error('Error deleting expense from cloud:', error);
            }
        }

        // Delete from localStorage
        const expenses = this.getExpensesLocal();
        const filtered = expenses.filter(e => e.id !== expenseId);
        localStorage.setItem('expenses', JSON.stringify(filtered));
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    Expense.init();
}

