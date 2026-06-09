import React, { createContext, useContext, useState, useEffect } from "react";
import api, { CATEGORIES_URL, SIZES_URL, PRODUCTS_URL } from "../utils/api";
import emitter, { getStatus, setStatus } from "../utils/backendStatus";
import fallbackProducts from "../data/products";

const ProductContext = createContext();

/* ---------------------------
   Helpers
----------------------------*/
const toSlug = (text = "") =>
    text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [loading, setLoading] = useState(true);

    const backendHost =
        process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

    /* ---------------------------
       Fix image URLs
    ----------------------------*/
    const ensureAbsoluteUrl = (url) => {
        if (!url) return null;

        if (
            url.startsWith("http://") ||
            url.startsWith("https://") ||
            url.startsWith("data:")
        ) {
            return url;
        }

        return `${backendHost}${url.startsWith("/") ? url : "/" + url}`;
    };

    const defaultSizes = [
        { id: 1, name: "S" },
        { id: 2, name: "M" },
        { id: 3, name: "L" },
        { id: 4, name: "XL" },
        { id: 5, name: "XXL" },
        { id: 6, name: "XXXL" },
    ];

    /* ---------------------------
       Categories fallback
    ----------------------------*/
    const deriveCategoriesFromFallback = () =>
        Array.from(
            new Set(fallbackProducts.map((p) => p.category))
        ).map((name, i) => ({
            id: i + 1,
            name,
        }));

    /* ---------------------------
       FETCH CATEGORIES
    ----------------------------*/
    const fetchCategories = async () => {
        if (getStatus() === "down") {
            setCategories(deriveCategoriesFromFallback());
            return;
        }

        try {
            const res = await api.get(CATEGORIES_URL);
            const raw = Array.isArray(res.data)
                ? res.data
                : res.data.results || [];
            setCategories(raw);
        } catch (err) {
            setStatus("down");
            setCategories(deriveCategoriesFromFallback());
        }
    };

    /* ---------------------------
       FETCH SIZES
    ----------------------------*/
    const fetchAllSizes = async () => {
        try {
            const res = await api.get(SIZES_URL);

            console.log("[SIZES API RESPONSE]", res.data);

            const raw = Array.isArray(res.data)
                ? res.data
                : res.data?.results || [];

            const normalized = raw
                .filter(Boolean)
                .map(s => ({
                    id: s.id,
                    name: s.name
                }));

            setSizes(normalized);
        } catch (err) {
            console.error("[SIZES FETCH ERROR]", err.response?.data || err.message);

            // fallback so UI never breaks
            setSizes([
                { id: 1, name: "S" },
                { id: 2, name: "M" },
                { id: 3, name: "L" },
                { id: 4, name: "XL" },
                { id: 5, name: "XXL" },
                { id: 6, name: "XXXL" },
            ]);
        }
    };

    /* ---------------------------
       NORMALIZE PRODUCT
    ----------------------------*/
    const normalize = (p) => {
        const placeholder =
            "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&q=80";

        const rawImages = p.images || [];

        const images = rawImages.map((img) => ({
            image: ensureAbsoluteUrl(img.image || img),
        }));

        const mainImage =
            ensureAbsoluteUrl(p.image || images?.[0]?.image) || placeholder;

        return {
            ...p,
            image: mainImage,
            images: images.length ? images : [{ image: mainImage }],

            price: Number(p.price || 0),
            originalPrice: Number(p.original_price || p.originalPrice || 0),

            rating: Number(p.rating || 0),
            reviews: Number(p.reviews || 0),

            category_name:
                typeof p.category === "string"
                    ? p.category
                    : p.category?.name || "",

            sizes: p.sizes || [],
        };
    };

    /* ---------------------------
       FETCH PRODUCTS
    ----------------------------*/
    const fetchProducts = async () => {
        if (getStatus() === "down") {
            setProducts(fallbackProducts.map(normalize));
            setLoading(false);
            return;
        }

        try {
            const res = await api.get(PRODUCTS_URL);
            const raw = Array.isArray(res.data)
                ? res.data
                : res.data.results || [];

            setProducts(raw.map(normalize));
        } catch (err) {
            setStatus("down");
            setProducts(fallbackProducts.map(normalize));
        } finally {
            setLoading(false);
        }
    };

    /* ---------------------------
       ADD PRODUCT (FIXED)
    ----------------------------*/
    const addProduct = async (product) => {
        if (getStatus() === "down") {
            alert("Backend is down");
            return false;
        }

        try {
            const categoryObj = categories.find(
                (c) =>
                    (c.name || "")
                        .toLowerCase()
                        .trim() ===
                    (product.category || "").toLowerCase().trim()
            );

            if (!categoryObj) {
                alert("Invalid category");
                return false;
            }

            const payload = {
                name: product.name,
                slug: `${toSlug(product.name)}-${Date.now()}`, // FIXED
                category: categoryObj.id,
                price: product.price,
                original_price: product.originalPrice,
                description: product.description,
                short_description:
                    product.description?.substring(0, 150) || product.name,

                images: (product.images || [])
                    .filter(Boolean)
                    .map((img) => ({
                        image:
                            typeof img === "string"
                                ? img
                                : img.image,
                    })),

                colors: (product.colors || []).map((c) => ({
                    name: c.name,
                    hex_code: c.hex || c.hex_code,
                })),

                sizes: (product.sizeIds || []).filter(Boolean),
            };

            const res = await api.post(
                "/api/store/admin/products/",
                payload
            );

            setProducts((prev) => [
                normalize(res.data),
                ...prev,
            ]);

            await fetchProducts();
            return true;
        } catch (err) {
            console.error(
                "[ADD PRODUCT ERROR]",
                err.response?.data || err.message
            );
            alert("Failed to add product");
            return false;
        }
    };

    /* ---------------------------
       UPDATE PRODUCT
    ----------------------------*/
    const updateProduct = async (productId, product) => {
        try {
            const categoryName =
                typeof product.category === "string"
                    ? product.category
                    : product.category?.name || "";

            const catObj = categories.find(
                c =>
                    (c.name || "").toString().toLowerCase().trim() ===
                    categoryName.toString().toLowerCase().trim()
            );

            const payload = {
                name: product.name,
                slug: toSlug(product.name),

                category: catObj?.id,

                price: product.price,

                original_price:
                    product.originalPrice ||
                    product.original_price,

                description: product.description,

                short_description:
                    product.description?.substring(0, 150) ||
                    product.name,

                colors: (product.colors || []).map(c => ({
                    name: c.name,
                    hex_code: c.hex || c.hex_code
                })),

                sizes:
                    product.sizeIds ||
                    product.sizes?.map(s => s.id) ||
                    [],

                images: (product.images || []).map(img => ({
                    image:
                        typeof img === "string"
                            ? img
                            : img.image
                }))
            };

            console.log("[UPDATE PAYLOAD]", payload);

            const res = await api.patch(
                `${PRODUCTS_URL}${productId}/`,
                payload
            );

            setProducts(prev =>
                prev.map(p =>
                    p.id === productId
                        ? normalize(res.data)
                        : p
                )
            );

            return true;
        } catch (err) {
            console.error(
                "[UPDATE PRODUCT ERROR]",
                err.response?.data || err.message
            );

            return false;
        }
    };

    /* ---------------------------
       DELETE PRODUCT
    ----------------------------*/
    const deleteProduct = async (id) => {
        try {
            await api.delete(`${PRODUCTS_URL}${id}/`);
            setProducts((prev) =>
                prev.filter((p) => p.id !== id)
            );
        } catch (err) {
            console.error(err);
        }
    };

    /* ---------------------------
       EFFECT
    ----------------------------*/
    useEffect(() => {
        fetchCategories();
        fetchAllSizes();
        fetchProducts();

        const onStatus = (e) => {
            if (e?.detail === "up") {
                setLoading(true);
                fetchCategories();
                fetchAllSizes();
                fetchProducts();
            }
        };

        emitter.addEventListener("status", onStatus);
        return () =>
            emitter.removeEventListener("status", onStatus);
    }, []);

    return (
        <ProductContext.Provider
            value={{
                products,
                categories,
                sizes,
                loading,
                addProduct,
                updateProduct,
                deleteProduct,
                fetchProducts,
            }}
        >
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => useContext(ProductContext);