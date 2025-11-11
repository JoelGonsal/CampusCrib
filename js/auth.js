// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('authToken') !== null || localStorage.getItem('token') !== null;
}

// Get current user data
function getCurrentUser() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

// Update UI based on authentication status
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const welcomeText = document.getElementById('welcomeText');
    const heroButton = document.getElementById('heroButton');
    const ctaButton = document.getElementById('ctaButton');
    const addPGButton = document.getElementById('addPGButton');
    const addTiffinButton = document.getElementById('addTiffinButton');
    const addRoommateButton = document.getElementById('addRoommateButton');
    const rentalsLink = document.getElementById('rentalsLink');
    const tenantsLink = document.getElementById('tenantsLink');
    
    if (isLoggedIn()) {
        const user = getCurrentUser();
        if (authButtons) {
            authButtons.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="text-sm">Welcome, ${user.full_name}</span>
                    <a href="dashboard.html" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Dashboard</a>
                    <button onclick="logout()" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">Logout</button>
                </div>
            `;
        }
        if (welcomeText) {
            welcomeText.textContent = `Welcome, ${user.full_name}`;
        }
        if (heroButton) {
            heroButton.href = 'dashboard.html';
            heroButton.textContent = 'Go to Dashboard';
        }
        if (ctaButton) {
            ctaButton.href = 'dashboard.html';
            ctaButton.textContent = 'Post Your Listing';
        }
        
        // Show add buttons for logged-in users
        if (addPGButton) {
            addPGButton.classList.remove('hidden');
        }
        if (addTiffinButton) {
            addTiffinButton.classList.remove('hidden');
        }
        if (addRoommateButton) {
            addRoommateButton.classList.remove('hidden');
        }
        
        // Show rental navigation links for logged-in users
        if (rentalsLink) {
            rentalsLink.style.display = 'block';
        }
        if (tenantsLink) {
            tenantsLink.style.display = 'block';
        }
        
        // Show roommate request navigation links for logged-in users
        const roommateRequestsLink = document.getElementById('roommateRequestsLink');
        const roommateReceivedLink = document.getElementById('roommateReceivedLink');
        if (roommateRequestsLink) {
            roommateRequestsLink.style.display = 'block';
        }
        if (roommateReceivedLink) {
            roommateReceivedLink.style.display = 'block';
        }
    } else {
        // Hide rental navigation links for non-logged-in users
        if (rentalsLink) {
            rentalsLink.style.display = 'none';
        }
        if (tenantsLink) {
            tenantsLink.style.display = 'none';
        }
        
        // Hide roommate request navigation links for non-logged-in users
        const roommateRequestsLink = document.getElementById('roommateRequestsLink');
        const roommateReceivedLink = document.getElementById('roommateReceivedLink');
        if (roommateRequestsLink) {
            roommateRequestsLink.style.display = 'none';
        }
        if (roommateReceivedLink) {
            roommateReceivedLink.style.display = 'none';
        }
    }
}

// Login function
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store token in both keys for compatibility
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('token', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            return { success: true, message: 'Login successful!' };
        } else {
            return { success: false, message: data.message || 'Login failed' };
        }
    } catch (error) {
        return { success: false, message: 'Network error. Please try again.' };
    }
}

// Register function
async function register(userData) {
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            return { success: true, message: 'Registration successful! Please login.' };
        } else {
            return { success: false, message: data.message || 'Registration failed' };
        }
    } catch (error) {
        return { success: false, message: 'Network error. Please try again.' };
    }
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
}

// Show message function
function showMessage(message, isError = false) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `mt-4 p-3 rounded ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
        messageDiv.classList.remove('hidden');
        
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 5000);
    }
}

// Initialize auth UI when page loads
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
    
    // Handle login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const result = await login(email, password);
            
            if (result.success) {
                showMessage(result.message);
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showMessage(result.message, true);
            }
        });
    }
    
    // Handle register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const userData = {
                full_name: document.getElementById('fullName').value,
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                course: document.getElementById('course').value,
                password: document.getElementById('password').value
            };
            
            const result = await register(userData);
            
            if (result.success) {
                showMessage(result.message);
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showMessage(result.message, true);
            }
        });
    }
    
    // Redirect to login if accessing protected pages
    const protectedPages = ['dashboard.html', 'add-pg.html', 'add-tiffin.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !isLoggedIn()) {
        window.location.href = 'login.html';
    }
});

// API helper function with auth token
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, mergedOptions);
        const data = await response.json();
        
        if (response.status === 401) {
            logout();
            return null;
        }
        
        return { success: response.ok, data, status: response.status };
    } catch (error) {
        console.error('API call failed:', error);
        return { success: false, error: error.message };
    }
}