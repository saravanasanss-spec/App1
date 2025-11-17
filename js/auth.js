// Authentication and User Management

const Auth = {
    currentUser: null,
    isAuthenticated: false,
    canUseCloudDb() {
        if (typeof CloudStorage === 'undefined' || !CloudStorage.isAvailable) {
            return false;
        }
        if (typeof db === 'undefined' || !db) {
            return false;
        }
        return true;
    },

    init() {
        // Check if user is logged in (from sessionStorage)
        const savedUser = sessionStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isAuthenticated = true;
        }
    },

    // Login user
    async login(username, password) {
        try {
            // Get users from cloud storage
            const users = await this.getUsers();
            
            // Find user by username
            const user = users.find(u => u.username === username && u.isActive !== false);
            
            if (!user) {
                throw new Error('Invalid username or password');
            }

            // Simple password check (in production, use proper hashing)
            if (user.password !== password) {
                throw new Error('Invalid username or password');
            }

            // Set current user
            this.currentUser = {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role || 'user',
                loginTime: new Date().toISOString()
            };

            this.isAuthenticated = true;
            sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            return this.currentUser;
        } catch (error) {
            throw error;
        }
    },

    // Logout user
    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    },

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    },

    // Check if user is authenticated
    checkAuth() {
        if (!this.isAuthenticated || !this.currentUser) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // Get all users from cloud
    async getUsers() {
        if (this.canUseCloudDb()) {
            try {
                const snapshot = await db.collection('users').get();
                const users = [];
                snapshot.forEach(doc => {
                    users.push(doc.data());
                });
                return users;
            } catch (error) {
                console.error('Error fetching users:', error);
                // Fallback to localStorage
                return this.getUsersLocal();
            }
        } else {
            console.warn('Cloud DB unavailable - using local users list');
            return this.getUsersLocal();
        }
    },

    // Get users from localStorage (fallback)
    getUsersLocal() {
        const users = localStorage.getItem('users');
        if (users) {
            return JSON.parse(users);
        }
        // Create default admin user if no users exist
        const defaultUsers = [
            {
                id: 'admin1',
                username: 'admin',
                password: 'admin123',
                name: 'Administrator',
                role: 'admin',
                isActive: true,
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
        return defaultUsers;
    },

    // Create new user
    async createUser(userData) {
        const newUser = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            username: userData.username,
            password: userData.password,
            name: userData.name,
            role: userData.role || 'user',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser ? this.currentUser.id : 'system'
        };

        // Save to cloud
        const canUseCloud = this.canUseCloudDb();
        if (canUseCloud) {
            try {
                await db.collection('users').doc(newUser.id).set(newUser);
            } catch (error) {
                console.error('Error saving user to cloud:', error);
            }
        } else {
            console.warn('Cloud DB unavailable while creating user - saving locally only');
        }

        // Also save to localStorage
        const users = this.getUsersLocal();
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        return newUser;
    },

    // Update user
    async updateUser(userId, userData) {
        const updateData = {
            ...userData,
            updatedAt: new Date().toISOString(),
            updatedBy: this.currentUser ? this.currentUser.id : 'system'
        };

        const canUseCloud = this.canUseCloudDb();
        if (canUseCloud) {
            try {
                await db.collection('users').doc(userId).update(updateData);
            } catch (error) {
                console.error('Error updating user in cloud:', error);
            }
        } else {
            console.warn('Cloud DB unavailable while updating user - local data will be used');
        }

        // Update localStorage
        const users = this.getUsersLocal();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updateData };
            localStorage.setItem('users', JSON.stringify(users));
        }
    },

    // Delete user (soft delete)
    async deleteUser(userId) {
        await this.updateUser(userId, { isActive: false });
    }
};

// Initialize auth on load
if (typeof window !== 'undefined') {
    Auth.init();
}

