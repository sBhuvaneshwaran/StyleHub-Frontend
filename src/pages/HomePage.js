import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import "./HomePage.css";

const CATEGORIES = ["All", "Men", "Women", "Kids", "Unisex"];

const HomePage = () => {
    const { products } = useProducts();
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [sortBy, setSortBy] = useState("default");

    const filtered = useMemo(() => {
        let list = [...products];

        // Category Filter
        if (activeCategory !== "All") {
            list = list.filter((p) => {
                const categoryName =
                    p.category_name ||
                    p.category?.name ||
                    "";

                console.log(
                    "Selected:",
                    activeCategory,
                    "Product:",
                    p.name,
                    "Category:",
                    categoryName
                );

                return (
                    categoryName.toLowerCase().trim() ===
                    activeCategory.toLowerCase().trim()
                );
            });
        }

        // Search Filter
        if (search.trim()) {
            const q = search.toLowerCase().trim();

            list = list.filter((p) => {
                const categoryName =
                    p.category_name ||
                    p.category?.name ||
                    (typeof p.category === "string" ? p.category : "");

                return (
                    (p.name || "").toLowerCase().includes(q) ||
                    (categoryName || "").toLowerCase().includes(q)
                );
            });
        }

        // Sorting
        switch (sortBy) {
            case "price-asc":
                list.sort((a, b) => Number(a.price) - Number(b.price));
                break;

            case "price-desc":
                list.sort((a, b) => Number(b.price) - Number(a.price));
                break;

            case "rating":
                list.sort((a, b) => Number(b.rating) - Number(a.rating));
                break;

            default:
                break;
        }

        return list;
    }, [products, activeCategory, search, sortBy]);

    return (
        <div className="home-page">
            {/* Hero Banner */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-text">
                        <p className="hero-eyebrow">New Season Arrivals 🌿</p>
                        <h1 className="hero-title">
                            Dress to <span className="gradient-text">Impress</span>
                        </h1>
                        <p className="hero-desc">
                            Discover the latest fashion trends for every occasion. Premium quality clothes at unbeatable prices.
                        </p>
                        <div className="hero-ctas">
                            {!user ? (
                                <Link to="/login" className="btn-primary">
                                    Shop Now →
                                </Link>
                            ) : (
                                <a href="#products" className="btn-primary">
                                    Explore Collection →
                                </a>
                            )}
                            <div className="hero-stats">
                                <div className="stat">
                                    <strong>500+</strong><span>Products</span>
                                </div>
                                <div className="stat-divider" />
                                <div className="stat">
                                    <strong>4.8★</strong><span>Avg Rating</span>
                                </div>
                                <div className="stat-divider" />
                                <div className="stat">
                                    <strong>Free</strong><span>Shipping</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="hero-image-stack">
                            <img
                                src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500"
                                alt="Fashion model"
                                className="hero-img hero-img-main"
                            />
                            <div className="hero-img-badge">
                                <span>🔥</span> Trending Now
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section className="products-section" id="products">
                <div className="section-header">
                    <h2 className="section-title">Our Collection</h2>
                    <p className="section-desc">Find the perfect outfit for every moment</p>
                </div>

                {/* Filters */}
                <div className="filters-bar">
                    <div className="search-wrap">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search clothes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="category-chips">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                className={`chip ${activeCategory === cat ? "chip-active" : ""}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <select
                        className="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="default">Sort: Featured</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="rating">Top Rated</option>
                    </select>
                </div>

                {/* Product Grid */}
                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <span>👕</span>
                        <p>No products found for "{search}"</p>
                    </div>
                ) : (
                    <>
                        <p className="result-count">{filtered.length} items found</p>
                        <div className="product-grid">
                            {filtered.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
};

export default HomePage;
