import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cart, setCart] = useState([]);
    const [favorites, setFavorites] = useState([]);

    const backendHost = process.env.REACT_APP_API_URL || "http://localhost:8000";
    const placeholder = "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&q=80";

    const ensureAbsoluteUrl = (url) => {
        if (!url) return placeholder;
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
        const cleanPath = url.startsWith("/") ? url : `/${url}`;
        return `${backendHost}${cleanPath}`;
    };

    // Helper: normalize a single image URL from Django image objects
    const getImageUrl = (images) => {
        if (!images || images.length === 0) return placeholder;
        const first = images[0];
        const rawUrl = typeof first === "string" ? first : first.image || null;
        return ensureAbsoluteUrl(rawUrl);
    };

    const fetchCart = useCallback(async () => {
        if (!user) { setCart([]); return; }
        try {
            const res = await api.get("/api/store/cart/");
            // Django may return: { items: [...] }  or  [...]
            const rawItems = res.data?.items || res.data || [];
            const formatted = rawItems.map(item => ({
                cartItemId: item.id,
                id: item.product?.id || item.product_id,
                name: item.product?.name,
                price: parseFloat(item.product?.price || 0),
                color: item.color?.name || "Default",
                color_id: item.color?.id || item.color_id || null,
                size: item.size?.name || null,
                size_id: item.size?.id || item.size_id || null,
                quantity: item.quantity,
                image: getImageUrl(item.product?.images),
            }));
            setCart(formatted);
        } catch (err) {
            console.error("[Cart] fetchCart error:", err.response?.data || err.message);
        }
    }, [user]);

    const fetchWishlist = useCallback(async () => {
        if (!user) { setFavorites([]); return; }
        try {
            const res = await api.get("/api/store/wishlist/");
            const rawItems = res.data?.items || res.data || [];
            const formatted = rawItems.map(item => ({
                wishlistItemId: item.id,
                id: item.product?.id || item.product_id,
                ...item.product,
                image: ensureAbsoluteUrl(item.product?.image || (item.product?.images?.[0]?.image) || (item.product?.images?.[0])),
                sizes: item.product?.sizes || [],
            }));
            setFavorites(formatted);
        } catch (err) {
            console.error("[Cart] fetchWishlist error:", err.response?.data || err.message);
        }
    }, [user]);

    useEffect(() => {
        fetchCart();
        fetchWishlist();
    }, [fetchCart, fetchWishlist]);

    const addToCart = async (product, color, colorName, quantity = 1, sizeId = null) => {
        if (!user) { alert("Please log in to add items to your cart."); return; }
        try {
            await api.post("/api/store/cart-items/", {
                product_id: product.id,
                color_id: color?.id || null,
                size_id: sizeId,
                quantity
            });
            await fetchCart();
        } catch (err) {
            console.error("[Cart] addToCart error:", err.response?.data || err.message);
        }
    };

    const removeFromCart = async (cartItemId) => {
        try {
            await api.delete(`/api/store/cart-items/${cartItemId}/`);
            await fetchCart();
        } catch (err) {
            if (err.response?.status === 404) {
                console.warn("[Cart] Item already removed or not found (404), refreshing cart...");
                await fetchCart();
                return;
            }
            console.error("[Cart] removeFromCart error:", err.response?.data || err.message);
        }
    };

    const updateQuantity = async (cartItemId, newQuantity) => {
        if (newQuantity < 1) return;
        try {
            await api.patch(`/api/store/cart-items/${cartItemId}/`, { quantity: newQuantity });
            await fetchCart();
        } catch (err) {
            console.error("[Cart] updateQuantity error:", err.response?.data || err.message);
        }
    };

    const toggleFavorite = async (product) => {
        if (!user) {
            alert("Please log in to manage favorites.");
            return;
        }

        // Standardize product ID: use id if available, account for nested structures
        const productId = product.id || product.product_id || (product.product && product.product.id);
        if (!productId) {
            console.error("[Cart] toggleFavorite error: No product ID found", product);
            return;
        }

        // Find the favorite entry by product ID
        const favoriteEntry = favorites.find(f => f.id === productId);

        try {
            if (favoriteEntry) {
                // If it exists in favorites, delete it using the WishlistItem ID
                const wishlistItemId = favoriteEntry.wishlistItemId;
                if (!wishlistItemId) {
                    // Fallback: If we don't have the wishlistItemId locally, we might need to fetch it
                    // but for now, we just warn and retry fetch
                    console.warn("[Cart] No wishlistItemId for removal, refreshing wishlist...");
                    await fetchWishlist();
                    return;
                }
                await api.delete(`/api/store/wishlist-items/${wishlistItemId}/`);
            } else {
                // If not in favorites, add it
                await api.post("/api/store/wishlist-items/", { product_id: productId });
            }
            // Always refresh after action to sync with server
            await fetchWishlist();
        } catch (err) {
            const status = err.response?.status;
            const data = err.response?.data;
            console.error(`[Cart] toggleFavorite error (${status}):`, data || err.message);

            // If 404 on delete, it might mean the item is already gone from server
            if (status === 404 && favoriteEntry) {
                console.warn("[Cart] Item not found on server, synchronizing local state.");
                await fetchWishlist();
            }
        }
    };

    const isFavorite = (productId) => favorites.some(p => p.id === productId);

    const clearCart = () => setCart([]);

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart, favorites,
            addToCart, removeFromCart, updateQuantity,
            toggleFavorite, isFavorite, clearCart,
            cartCount, cartTotal,
            fetchCart, fetchWishlist
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
