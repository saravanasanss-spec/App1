// Login page logic

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    // Initialize CloudStorage if available
    if (typeof CloudStorage !== 'undefined') {
        CloudStorage.init();
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        errorMessage.classList.remove('show');
        errorMessage.textContent = '';

        if (!username || !password) {
            errorMessage.textContent = 'Please enter username and password';
            errorMessage.classList.add('show');
            return;
        }

        try {
            await Auth.login(username, password);
            // Redirect to main page
            window.location.href = 'index.html';
        } catch (error) {
            errorMessage.textContent = error.message || 'Login failed. Please try again.';
            errorMessage.classList.add('show');
        }
    });

    // Allow Enter key to submit
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
});

