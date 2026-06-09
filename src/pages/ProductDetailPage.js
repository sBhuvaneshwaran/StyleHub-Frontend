import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiHeart, FiShoppingCart, FiChevronLeft, FiStar } from "react-icons/fi";
import { useProducts } from "../context/ProductContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import ColorSwatch from "../components/ColorSwatch";
import "./ProductDetailPage.css";

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { products } = useProducts();
    const { addToCart, toggleFavorite, isFavorite } = useCart();
    const { user } = useAuth();

    const product = products.find((p) => p.id === Number(id));
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedColorName, setSelectedColorName] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [currentImg, setCurrentImg] = useState(0);
    const [cartMsg, setCartMsg] = useState("");

    if (!product) {
        return (
            <div className="not-found">
                <h2>Product not found</h2>
                <Link to="/" className="back-btn">← Back to Home</Link>
            </div>
        );
    }

    const faved = isFavorite(product.id);
    const discount = product.originalPrice ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
    ) : 0;

    const handleAddToCart = () => {
        if (!user) { navigate("/login"); return; }
        if (product.sizes?.length > 0 && !selectedSize) {
            alert("Please select a size");
            return;
        }
        const color = selectedColor || (product.colors && product.colors[0]);
        const colorName = selectedColorName || (product.colors && product.colors[0]?.name);
        addToCart(product, color, colorName, quantity, selectedSize?.id);
        setCartMsg("Added to cart! 🛒");
        setTimeout(() => setCartMsg(""), 2500);
    };

    const handleFav = () => {
        if (!user) { navigate("/login"); return; }
        toggleFavorite(product);
    };

    const getProductImage = (idx) => {
        return product.images[idx]?.image || product.image;
    };

    return (
        <div className="detail-page">
            <div className="detail-container">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <FiChevronLeft size={18} /> Back
                </button>

                <div className="detail-grid">
                    {/* Image Gallery */}
                    <div className="detail-gallery">
                        <div className="main-image-wrap">
                            <img
                                src={getProductImage(currentImg) || "/placeholder.png"}
                                alt={product.name}
                                className="main-image"
                                onError={(e) => {
                                    e.target.src = "/placeholder.png";
                                }}
                            />
                            {product.badge && (
                                <span className="detail-badge">{product.badge}</span>
                            )}
                            {discount > 0 && (
                                <span className="detail-discount">-{discount}% OFF</span>
                            )}
                        </div>
                        {product.images?.length > 1 && (
                            <div className="thumb-row">
                                {product.images.map((imgObj, i) => (
                                    <button
                                        key={i}
                                        className={`thumb-btn ${currentImg === i ? "thumb-active" : ""}`}
                                        onClick={() => setCurrentImg(i)}
                                    >
                                        <img src={imgObj.image || imgObj} alt={`View ${i + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="detail-info">
                        <span className="detail-category">{product.category_name}</span>
                        <h1 className="detail-name">{product.name}</h1>

                        <div className="detail-rating">
                            <div className="stars">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <FiStar
                                        key={s}
                                        size={16}
                                        fill={s <= Math.round(product.rating || 0) ? "#f59e0b" : "none"}
                                        color={s <= Math.round(product.rating || 0) ? "#f59e0b" : "#d1d5db"}
                                    />
                                ))}
                            </div>
                            <span className="rating-val">{product.rating || 0}</span>
                            <span className="review-count">({product.reviews || 0} reviews)</span>
                        </div>

                        <div className="detail-pricing">
                            <span className="detail-price">₹{product.price?.toLocaleString()}</span>
                            {product.originalPrice > product.price && (
                                <span className="detail-original">₹{product.originalPrice.toLocaleString()}</span>
                            )}
                            {discount > 0 && (
                                <span className="detail-save">Save {discount}%</span>
                            )}
                        </div>

                        <div className="detail-desc">
                            <p>{product.description}</p>
                        </div>

                        {/* Color Selection */}
                        <div className="color-section">
                            <div className="color-header">
                                <span className="section-label">Color:</span>
                                <span className="selected-color-name">
                                    {selectedColorName || product.colors?.[0]?.name || "Select a color"}
                                </span>
                            </div>
                            <ColorSwatch
                                colors={product.colors?.map(c => (typeof c === 'string' ? c : (c.hex || c.hex_code || c.name))) || []}
                                colorNames={product.colors?.map(c => (typeof c === 'string' ? c : (c.name || c.hex || c.hex_code))) || []}
                                selected={selectedColorName || (typeof product.colors?.[0] === 'string' ? product.colors?.[0] : product.colors?.[0]?.name)}
                                onSelect={(cName) => {
                                    const cObj = product.colors.find(c => (typeof c === 'string' ? c === cName : (c.name === cName || c.hex === cName || c.hex_code === cName)));
                                    setSelectedColor(cObj);
                                    setSelectedColorName(cName);
                                }}
                            />
                        </div>

                        {/* Size Selection */}
                        {product.sizes?.length > 0 && (
                            <div className="size-section">
                                <div className="size-header">
                                    <span className="section-label">Size:</span>
                                    <span className="selected-size-name">
                                        {selectedSize?.name || "Choose size"}
                                    </span>
                                </div>
                                <div className="size-picker">
                                    {product.sizes.map((s) => (
                                        <button
                                            key={s.id}
                                            className={`size-chip ${selectedSize?.id === s.id ? "active" : ""}`}
                                            onClick={() => setSelectedSize(s)}
                                        >
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className="qty-section">
                            <span className="section-label">Quantity:</span>
                            <div className="qty-control">
                                <button
                                    className="qty-btn"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                >−</button>
                                <span className="qty-val">{quantity}</span>
                                <button
                                    className="qty-btn"
                                    onClick={() => setQuantity((q) => q + 1)}
                                >+</button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="detail-actions">
                            <button className="btn-add-cart" onClick={handleAddToCart}>
                                <FiShoppingCart size={18} />
                                Add to Cart
                            </button>
                            <button
                                className={`btn-fav ${faved ? "btn-fav-active" : ""}`}
                                onClick={handleFav}
                                title={faved ? "Remove from Favorites" : "Add to Favorites"}
                            >
                                <FiHeart size={20} fill={faved ? "#ff4d6d" : "none"} />
                            </button>
                        </div>

                        {cartMsg && (
                            <div className="cart-toast">{cartMsg}</div>
                        )}


                        {/* Delivery Info */}
                        <div className="delivery-info">
                            <div className="delivery-item">🚚 <span>Free delivery on orders above ₹999</span></div>
                            <div className="delivery-item">↩️ <span>7-day easy returns</span></div>
                            <div className="delivery-item">✅ <span>100% authentic products</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
