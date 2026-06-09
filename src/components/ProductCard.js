import React from "react";
import { Link } from "react-router-dom";
import { FiHeart } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "./ProductCard.css";

const ProductCard = ({ product }) => {
    const { toggleFavorite, isFavorite } = useCart();
    const { user } = useAuth();
    const faved = isFavorite(product.id);

    const handleFav = (e) => {
        e.preventDefault();
        if (!user) return;
        toggleFavorite(product);
    };

    const discount = product.originalPrice ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
    ) : 0;

    return (
        <div className="product-card">
            <Link to={`/product/${product.id}`} className="card-image-wrap">
                <img src={product.image} alt={product.name} className="card-image" />
                {product.badge && <span className="card-badge">{product.badge}</span>}
                {discount > 0 && (
                    <span className="discount-tag">-{discount}%</span>
                )}
                {user && (
                    <button
                        className={`fav-btn ${faved ? "faved" : ""}`}
                        onClick={handleFav}
                        title={faved ? "Remove from favorites" : "Add to favorites"}
                    >
                        <FiHeart size={18} fill={faved ? "#ff4d6d" : "none"} />
                    </button>
                )}
            </Link>
            <div className="card-body">
                <span className="card-category">{product.category_name}</span>
                <Link to={`/product/${product.id}`}>
                    <h3 className="card-name">{product.name}</h3>
                </Link>
                <div className="product-swatches">
                    {product.colors && product.colors.map((c, i) => {
                        const colorValue = typeof c === 'string' ? c : (c.hex || c.hex_code || c.name || '#ccc');
                        const title = typeof c === 'string' ? c : (c.name || colorValue);
                        return (
                            <span
                                key={i}
                                className="swatch"
                                style={{ backgroundColor: colorValue }}
                                title={title}
                            />
                        );
                    })}
                    {product.sizes && product.sizes.length > 0 && (
                        <div className="card-sizes">
                            {product.sizes.map((s, i) => (
                                <span key={i} className="size-badge">{s.name}</span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="card-pricing">
                    <span className="card-price">₹{product.price?.toLocaleString()}</span>
                    {product.originalPrice > product.price && (
                        <span className="card-original">₹{product.originalPrice.toLocaleString()}</span>
                    )}
                </div>
                <div className="card-rating">
                    {"★".repeat(Math.round(product.rating || 0))}
                    {"☆".repeat(5 - Math.round(product.rating || 0))}
                    <span className="rating-count">({product.reviews || 0})</span>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
