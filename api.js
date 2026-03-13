/**
 * Djassa CI API Client
 * This file provides functions to interact with the Djassa CI Backend API
 * Replace localStorage operations with these API calls
 */

const API_BASE_URL = 'http://localhost:3000/api';
const TOKEN_EXPIRY_DAYS = 7;
const REFRESH_THRESHOLD_DAYS = 1;

// Helper function to get token
const getToken = () => localStorage.getItem('authToken');

// Helper function to set token
const setToken = (token) => {
    localStorage.setItem('authToken', token);
    // Store token expiration time (7 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + TOKEN_EXPIRY_DAYS);
    localStorage.setItem('authTokenExpiry', expiryDate.toISOString());
};

// Helper function to get token expiry date
const getTokenExpiry = () => {
    const expiry = localStorage.getItem('authTokenExpiry');
    return expiry ? new Date(expiry) : null;
};

// Helper function to check if token is expiring soon (within 1 day)
const isTokenExpiringSoon = () => {
    const expiry = getTokenExpiry();
    if (!expiry) return true;
    
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + REFRESH_THRESHOLD_DAYS);
    
    return expiry < threshold;
};

// Helper function to refresh token
const refreshToken = async () => {
    const token = getToken();
    if (!token) {
        return null;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.token) {
                setToken(data.token);
                console.log('Token refreshed successfully');
                return data.token;
            }
        }
        
        console.error('Token refresh failed');
        return null;
    } catch (error) {
        console.error('Token refresh error:', error);
        return null;
    }
};

// Helper function to get valid token (refresh if needed)
const getValidToken = async () => {
    const token = getToken();
    if (!token) {
        return null;
    }
    
    // Check if token is expiring soon and refresh if needed
    if (isTokenExpiringSoon()) {
        console.log('Token expiring soon, refreshing...');
        const newToken = await refreshToken();
        return newToken || token;
    }
    
    return token;
};

// Helper function to remove token
const removeToken = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authTokenExpiry');
};

// ==================== AUTH API ====================

const authAPI = {
    // Register new user
    register: async (userData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            
            console.log('Registration response:', data);
            
            if (response.ok && data.token) {
                setToken(data.token);
                localStorage.setItem('utilisateurConnecte', JSON.stringify(data.user));
                console.log('Token stored successfully');
            } else {
                console.error('Registration failed:', data.error);
            }
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            return { error: error.message };
        }
    },

    // Login user
    login: async (numero, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numero, password })
            });
            const data = await response.json();
            
            console.log('Login response:', data);
            
            if (response.ok && data.token) {
                setToken(data.token);
                localStorage.setItem('utilisateurConnecte', JSON.stringify(data.user));
                console.log('Token stored successfully');
            } else {
                console.error('Login failed:', data.error);
            }
            return data;
        } catch (error) {
            console.error('Login error:', error);
            return { error: error.message };
        }
    },

    // Logout
    logout: () => {
        removeToken();
        localStorage.removeItem('utilisateurConnecte');
    },

    // Get current user
    getCurrentUser: async () => {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        return response.json();
    },

    // Check if logged in
    isLoggedIn: () => !!getToken()
};

// ==================== PRODUCTS API ====================

const productsAPI = {
    // Get all products
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/products`);
        return response.json();
    },

    // Get product by ID
    getById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        return response.json();
    },

    // Get products by category
    getByCategory: async (category) => {
        const response = await fetch(`${API_BASE_URL}/products/category/${category}`);
        return response.json();
    },

    // Search products
    search: async (query) => {
        const response = await fetch(`${API_BASE_URL}/products/search/${query}`);
        return response.json();
    },

    // Create product (seller)
    create: async (productData) => {
        const token = await getValidToken();
        console.log('Creating product - Token:', token ? 'Present' : 'MISSING');
        console.log('Product data:', productData);
        
        if (!token) {
            return { error: 'No authentication token. Please login again.' };
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });
            const data = await response.json();
            if (!response.ok) {
                console.error('Create product error:', data.error);
            }
            return data;
        } catch (error) {
            console.error('Create product error:', error);
            return { error: error.message };
        }
    },

    // Update product
    update: async (id, productData) => {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(productData)
        });
        return response.json();
    },

    // Delete product
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        return response.json();
    },

    // Get my products (seller)
    getMyProducts: async () => {
        const response = await fetch(`${API_BASE_URL}/products/seller/my`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        return response.json();
    }
};

// ==================== SELLERS API ====================

const sellersAPI = {
    // Get all sellers
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/sellers`);
        return response.json();
    },

    // Get seller's products
    getSellerProducts: async (sellerName) => {
        const response = await fetch(`${API_BASE_URL}/sellers/${encodeURIComponent(sellerName)}/products`);
        return response.json();
    }
};

// ==================== ORDERS API ====================

const ordersAPI = {
    // Create order
    create: async (orderData) => {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(orderData)
        });
        return response.json();
    },

    // Get my orders
    getMyOrders: async () => {
        const response = await fetch(`${API_BASE_URL}/orders/my`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        return response.json();
    },

    // Get order by ID
    getById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        return response.json();
    },

    // Get all orders (admin)
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        return response.json();
    }
};

// ==================== USERS API ====================

const usersAPI = {
    // Get my profile
    getProfile: async () => {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        return response.json();
    },

    // Update my profile
    updateProfile: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(userData)
        });
        return response.json();
    }
};

// ==================== ARTICLES API ====================

const articlesAPI = {
    // Get all articles
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/articles`);
        return response.json();
    },

    // Get article by ID
    getById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/articles/${id}`);
        return response.json();
    },

    // Create new article
    create: async (articleData) => {
        const response = await fetch(`${API_BASE_URL}/articles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(articleData)
        });
        return response.json();
    },

    // Delete article
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    }
};

// ==================== CONTACT API ====================

const contactAPI = {
    // Send contact message
    sendMessage: async (data) => {
        const response = await fetch(`${API_BASE_URL}/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Contact seller
    contactSeller: async (data) => {
        const response = await fetch(`${API_BASE_URL}/contact/seller`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    }
};

// ==================== EXPORTS ====================

// For use with ES6 modules
// export { authAPI, productsAPI, sellersAPI, ordersAPI, usersAPI, articlesAPI, contactAPI };

// For use with script tags (global variables)
window.DjassaAPI = {
    auth: authAPI,
    products: productsAPI,
    sellers: sellersAPI,
    orders: ordersAPI,
    users: usersAPI,
    articles: articlesAPI,
    contact: contactAPI
};

console.log('Djassa CI API Client loaded!');
