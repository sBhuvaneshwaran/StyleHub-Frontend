import axios from 'axios';

// Django backend base URL — change port if your Django server uses a different port
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Automatically attach the Django Token to every authenticated request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('clothesShopToken');
        if (token) {
            // Django REST Framework uses "Token <key>" format
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Global response error handler
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid — clear it
            localStorage.removeItem('clothesShopToken');
        }
        return Promise.reject(error);
    }
);

export default api;
