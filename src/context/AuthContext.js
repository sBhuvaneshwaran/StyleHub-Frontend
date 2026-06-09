import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { setStatus } from "../utils/backendStatus";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    // Load user profile using stored token
    const loadUser = async () => {
        const token = localStorage.getItem("clothesShopToken");

        if (!token) {
            setLoadingAuth(false);
            return;
        }

        try {
            const response = await api.get("/api/accounts/profile/");
            const profileData = response.data;

            const roleRaw =
                profileData.role ||
                (profileData.is_shop_owner ? "owner" : "customer");

            const role =
                typeof roleRaw === "string"
                    ? roleRaw.toLowerCase()
                    : roleRaw;

            setUser({
                ...profileData,
                role,
            });
        } catch (error) {
            console.error(
                "[Auth] Failed to load profile:",
                error.response?.status,
                error.message
            );

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
            const response = await api.post("/api/accounts/login/", {
                username: credential,
                password,
            });

            const { token, user: userData } = response.data;

            if (!token) {
                return {
                    success: false,
                    message: "Login failed. No token received.",
                };
            }

            localStorage.setItem("clothesShopToken", token);

            let finalUser;

            if (userData) {
                const roleRaw =
                    userData.role ||
                    (userData.is_shop_owner ? "owner" : "customer");

                const role =
                    typeof roleRaw === "string"
                        ? roleRaw.toLowerCase()
                        : roleRaw;

                finalUser = {
                    ...userData,
                    role,
                };

                setUser(finalUser);
            } else {
                const profileResponse = await api.get(
                    "/api/accounts/profile/"
                );

                const profile = profileResponse.data;

                const roleRaw =
                    profile.role ||
                    (profile.is_shop_owner ? "owner" : "customer");

                const role =
                    typeof roleRaw === "string"
                        ? roleRaw.toLowerCase()
                        : roleRaw;

                finalUser = {
                    ...profile,
                    role,
                };

                setUser(finalUser);
            }

            const redirect =
                finalUser?.is_shop_owner ||
                finalUser?.role === "owner"
                    ? "/dashboard"
                    : "/";

            return {
                success: true,
                user: finalUser,
                redirect,
            };
        } catch (error) {
            const data = error.response?.data;
            const status = error.response?.status;

            if (status === 400 || status === 401) {
                const msg =
                    data?.non_field_errors?.[0] ||
                    data?.detail ||
                    "Invalid username or password.";

                return {
                    success: false,
                    message: msg,
                };
            }

            if (status >= 500) {
                setStatus("down");

                return {
                    success: false,
                    message:
                        "Server error (500). Please try again later.",
                };
            }

            return {
                success: false,
                message:
                    "Failed to connect to backend server.",
            };
        }
    };

    const signup = async (username, email, password) => {
        try {
            const response = await api.post(
                "/api/accounts/register/",
                {
                    username,
                    email,
                    password,
                    is_customer: true,
                    is_shop_owner: false,
                }
            );

            const { token, user: userData } = response.data;

            if (!token) {
                return {
                    success: false,
                    message:
                        "Signup successful. Please login.",
                };
            }

            localStorage.setItem("clothesShopToken", token);

            const roleRaw =
                userData.role ||
                (userData.is_shop_owner ? "owner" : "customer");

            const role =
                typeof roleRaw === "string"
                    ? roleRaw.toLowerCase()
                    : roleRaw;

            const finalUser = {
                ...userData,
                role,
            };

            setUser(finalUser);

            return {
                success: true,
                user: finalUser,
            };
        } catch (error) {
            const data = error.response?.data;
            const status = error.response?.status;

            if (status >= 500) {
                setStatus("down");

                return {
                    success: false,
                    message:
                        "Server error (500). Please try again later.",
                };
            }

            let msg = "Signup failed.";

            if (data) {
                msg =
                    Object.entries(data)
                        .map(
                            ([key, val]) =>
                                `${key}: ${
                                    Array.isArray(val)
                                        ? val.join(" ")
                                        : val
                                }`
                        )
                        .join("\n") || msg;
            }

            return {
                success: false,
                message: msg,
            };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("clothesShopToken");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                signup,
                logout,
                loadingAuth,
            }}
        >
            {!loadingAuth && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);