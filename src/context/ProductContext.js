import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const ProductContext = createContext();

const toSlug = (name) =>
    name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [loading, setLoading] = useState(true);

    const backendHost = process.env.REACT_APP_API_URL || "http://localhost:8000";

    const ensureAbsoluteUrl = (url) => {
        if (!url) return null;
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
        const cleanPath = url.startsWith("/") ? url : `/${url}`;
        return `${backendHost}${cleanPath}`;
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get("/api/store/categories/");
            const raw = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setCategories(raw);
        } catch (err) {
            console.error("[Products] fetchCategories error:", err.message);
        }
    };

    const fetchAllSizes = async () => {
        try {
            const res = await api.get("/api/store/sizes/");
            const raw = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setSizes(raw);
        } catch (err) {
            console.error("[Products] fetchAllSizes error:", err.message);
        }
    };

    const normalize = (p) => {
        const placeholder = "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&q=80";

        const rawImages = p.images || [];
        const normalizedImages = rawImages.map(img => ({
            ...img,
            image: ensureAbsoluteUrl(img.image || img)
        }));

        const mainImage = ensureAbsoluteUrl(p.image || (normalizedImages.length > 0 ? normalizedImages[0].image : null)) || placeholder;

        return {
            ...p,
            image: mainImage,
            images: normalizedImages,
            colors: p.colors || [],
            colorNames: (p.colors || []).map(c => c.name),
            price: parseFloat(p.price || 0),
            originalPrice: parseFloat(p.original_price || p.originalPrice || 0),
            original_price: parseFloat(p.original_price || p.originalPrice || 0),
            rating: parseFloat(p.rating || 0),
            reviews: parseInt(p.reviews || 0),
            badge: p.badge || "",
            category_name: p.category_name || (typeof p.category === 'string' ? p.category : ""),
            sizes: p.sizes || []
        };
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get("/api/store/products/");
            const raw = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setProducts(raw.map(normalize));
        } catch (err) {
            console.error("[Products] fetchProducts error:", err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchAllSizes();
        fetchProducts();
    }, []);

    const addProduct = async (product) => {
        try {
            console.log("[Products] addProduct incoming:", product.category);
            let catList = categories;
            if (catList.length === 0) {
                const res = await api.get("/api/store/categories/");
                catList = Array.isArray(res.data) ? res.data : (res.data.results || []);
                setCategories(catList);
            }

            const catObj = catList.find(
                c => c.name.toLowerCase() === (product.category || "").toLowerCase()
            ) || catList[0];

            const categoryId = catObj?.id || null;

            if (!categoryId) {
                alert(`No valid category ID found for "${product.category}".`);
                return false;
            }

            const payload = {
                name: product.name,
                slug: toSlug(product.name),
                category: categoryId,
                price: product.price,
                original_price: product.originalPrice,
                description: product.description,
                short_description: product.description?.substring(0, 150) || product.name,
                images: (product.images || [])
                    .filter(img => img && (typeof img === "string" ? img.trim() : true))
                    .map(img => ({ image: typeof img === "string" ? img : img.image })) || [],
                colors: (product.colors || []).map(c => ({
                    name: c.name,
                    hex_code: c.hex || c.hex_code
                })),
                sizes: product.sizeIds || product.sizes?.map(s => s.id) || [],
            };

            const res = await api.post("/api/store/admin/products/", payload);
            setProducts(prev => [normalize(res.data), ...prev]);
            await fetchProducts();
            return true;
        } catch (err) {
            const errData = err.response?.data;
            console.error("[Products] addProduct error:", errData || err.message);
            if (errData?.category) {
                alert(`Category "${product.category}" does not exist.`);
            } else if (errData) {
                const msgs = Object.entries(errData)
                    .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(", ") : errs}`)
                    .join("\n");
                alert(`Could not add product:\n${msgs}`);
            }
            return false;
        }
    };

    const updateProduct = async (productId, product) => {
        try {
            const catObj = categories.find(
                c => c.name.toLowerCase() === (product.category || "").toLowerCase()
            ) || categories[0];

            const payload = {
                name: product.name,
                slug: toSlug(product.name),
                category: catObj?.id,
                price: product.price,
                original_price: product.originalPrice,
                description: product.description,
                short_description: product.description?.substring(0, 150) || product.name,
                images: (product.images || [])
                    .filter(img => img && (typeof img === "string" ? img.trim() : true))
                    .map(img => ({ image: typeof img === "string" ? img : (img.image || img) })),
                colors: (product.colors || []).map(c => ({
                    name: c.name,
                    hex_code: c.hex || c.hex_code
                })),
                sizes: product.sizeIds || product.sizes?.map(s => s.id) || [],
            };

            const res = await api.patch(`/api/store/admin/products/${productId}/`, payload);
            setProducts(prev => prev.map(p => p.id === productId ? normalize(res.data) : p));
            return true;
        } catch (err) {
            console.error("[Products] updateProduct error:", err.response?.data || err.message);
            return false;
        }
    };

    const deleteProduct = async (productId) => {
        try {
            await api.delete(`/api/store/admin/products/${productId}/`);
            setProducts(prev => prev.filter(p => p.id !== productId));
        } catch (err) {
            console.error("[Products] deleteProduct error:", err.response?.data || err.message);
        }
    };

    return (
        <ProductContext.Provider value={{ products, categories, sizes, loading, addProduct, updateProduct, deleteProduct, fetchProducts }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => useContext(ProductContext);
