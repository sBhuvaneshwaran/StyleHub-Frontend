import axios from 'axios';
import { setStatus } from './backendStatus';

// Django backend base URL — change port if your Django server uses a different port
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout (longer for cold starts)
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
    async (error) => {
        const config = error.config;

        // If there is no config, can't retry
        if (!config) {
            if (error.response?.status === 401) {
                localStorage.removeItem('clothesShopToken');
            }
            if (error.response?.status >= 500 || !error.response) setStatus('down');
            return Promise.reject(error);
        }

        // Simple retry strategy for network errors, timeouts, and 5xx
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 1000; // base delay in ms

        config.__retryCount = config.__retryCount || 0;

        const isNetworkOrTimeout = !error.response || error.code === 'ECONNABORTED';
        const isServerError = error.response && error.response.status >= 500 && error.response.status < 600;

        const shouldRetry = isNetworkOrTimeout || isServerError;

        if (shouldRetry && config.__retryCount < MAX_RETRIES) {
            config.__retryCount += 1;
            await new Promise((res) => setTimeout(res, RETRY_DELAY * config.__retryCount));
            // mark backend as down while retrying
            setStatus('down');
            return api(config);
        }
        if (error.response?.status === 401) {
            // Token expired or invalid — clear it
            localStorage.removeItem('clothesShopToken');
        }

        if (error.response?.status >= 500 || !error.response) setStatus('down');

        return Promise.reject(error);
    }
);

// mark backend as up on any successful response
api.interceptors.response.use((res) => {
    setStatus('up');
    return res;
}, (err) => Promise.reject(err));

export default api;
