import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { setStatus } from "../utils/backendStatus";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    // Load user profile using the stored token
    const loadUser = async () => {
        const token = localStorage.getItem("clothesShopToken");
        if (!token) {
            setLoadingAuth(false);
            return;
        }
        try {
            const response = await api.get("/api/accounts/profile/");
            // Django profile returns user fields directly: { id, username, email, is_shop_owner, is_customer, ... }
            const profileData = response.data;
            // Derive role from Django model fields
            const role = profileData.role || (profileData.is_shop_owner ? "owner" : "customer");
            setUser({ ...profileData, role });
        } catch (error) {
            console.error("[Auth] Failed to load profile:", error.response?.status, error.message);
            localStorage.removeItem("clothesShopToken");
            setUser(null);
        } finally {
            setLoadingAuth(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    const login = async (credential, password) => {
        try {
            // Django login: POST { username, password } → { token: "..." } or { token, user: {...} }
            const response = await api.post("/api/accounts/login/", {
                username: credential,
                password: password
            });

            const { token, user: userData } = response.data;
            if (!token) {
                return { success: false, message: "Login failed: no token received." };
            }

            localStorage.setItem("clothesShopToken", token);

            let finalUser;
            if (userData) {
                // Backend returned user inline
                const role = userData.role || (userData.is_shop_owner ? "owner" : "customer");
                finalUser = { ...userData, role };
                setUser(finalUser);
            } else {
                // Fetch profile separately
                await loadUser();
                // setUser was called inside loadUser, retrieve the latest
                finalUser = await api.get("/api/accounts/profile/").then(r => {
                    const p = r.data;
                    const role = p.role || (p.is_shop_owner ? "owner" : "customer");
                    return { ...p, role };
                }).catch(() => null);
                if (finalUser) setUser(finalUser);
            }

            return { success: true, user: finalUser };
        } catch (error) {
            const data = error.response?.data;
            const status = error.response?.status;

            // Django 400: wrong credentials or validation error
            if (status === 400 || status === 401) {
                const msg =
                    data?.non_field_errors?.[0] ||
                    data?.detail ||
                    data?.username?.[0] ||
                    data?.password?.[0] ||
                    "Invalid credentials. Please check your username and password.";
                return { success: false, message: msg };
            }

            // Server-side error: provide clearer message and optional local fallback for dev
            if (status >= 500) {
                setStatus('down');
                console.warn("[Auth] Login server error: 500 or network");
                if (process.env.REACT_APP_LOCAL_AUTH_FALLBACK === 'true') {
                    const mockToken = 'local-dev-token';
                    localStorage.setItem('clothesShopToken', mockToken);
                    const mockUser = { id: 0, username: credential, email: credential, role: 'customer' };
                    setUser(mockUser);
                    return { success: true, user: mockUser, fallback: true };
                }
                return { success: false, message: 'Server error (500). Please try again later.' };
            }

            console.error("[Auth] Login error:", data || error.message);
            return { success: false, message: "Server error. Failed to connect to the backend API." };
        }
    };

    const signup = async (username, email, password) => {
        try {
            const response = await api.post("/api/accounts/register/", {
                username,
                email,
                password,
                is_customer: true,
                is_shop_owner: false
            });

            const { token, user: userData } = response.data;
            if (!token) return { success: false, message: "Signup successful but no token received. Please login." };

            localStorage.setItem("clothesShopToken", token);
            const role = userData.role || (userData.is_shop_owner ? "owner" : "customer");
            const finalUser = { ...userData, role };
            setUser(finalUser);
            return { success: true, user: finalUser };
        } catch (error) {
            const data = error.response?.data;
            const status = error.response?.status;

            if (status >= 500) {
                setStatus('down');
                console.warn("[Auth] Signup server error: 500 or network");
                if (process.env.REACT_APP_LOCAL_AUTH_FALLBACK === 'true') {
                    const mockToken = 'local-dev-token';
                    localStorage.setItem('clothesShopToken', mockToken);
                    const mockUser = { id: 0, username, email, role: 'customer' };
                    setUser(mockUser);
                    return { success: true, user: mockUser, fallback: true };
                }
                return { success: false, message: 'Server error (500). Please try again later.' };
            }

            let msg = "Signup failed.";
            if (data) {
                msg = Object.entries(data)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(" ") : val}`)
                    .join("\n") || msg;
            }
            return { success: false, message: msg };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("clothesShopToken");
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loadingAuth }}>
            {!loadingAuth && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
