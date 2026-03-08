import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiHeart, FiShoppingCart, FiTrash2 } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "./FavoritesPage.css";

const FavoritesPage = () => {
    const { favorites, toggleFavorite, addToCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        return (
            <div className="empty-page">
                <FiHeart size={64} />
                <h2>Please login to view your favorites</h2>
                <Link to="/login" className="btn-primary">Login</Link>
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="empty-page">
                <span className="empty-icon">❤️</span>
                <h2>No favorites yet</h2>
                <p>Tap the ❤️ on any product to save it here!</p>
                <Link to="/" className="btn-primary">Browse Products</Link>
            </div>
        );
    }

    return (
        <div className="fav-page">
            <div className="fav-container">
                <div className="fav-header">
                    <h1 className="page-title">My Favorites <span>({favorites.length})</span></h1>
                </div>

                <div className="fav-grid">
                    {favorites.map((product) => {
                        const discount = Math.round(
                            ((product.originalPrice - product.price) / product.originalPrice) * 100
                        );
                        return (
                            <div className="fav-card" key={product.id}>
                                <Link to={`/product/${product.id}`} className="fav-image-wrap">
                                    <img src={product.image || (product.images && product.images[0]?.image)} alt={product.name} className="fav-image" />
                                    {product.badge && (
                                        <span className="fav-badge">{product.badge}</span>
                                    )}
                                </Link>
                                <div className="fav-info">
                                    <span className="fav-category">{product.category}</span>
                                    <Link to={`/product/${product.id}`}>
                                        <h3 className="fav-name">{product.name}</h3>
                                    </Link>
                                    <div className="fav-pricing">
                                        <span className="fav-price">₹{product.price?.toLocaleString()}</span>
                                        {product.originalPrice && (
                                            <span className="fav-original">₹{product.originalPrice.toLocaleString()}</span>
                                        )}
                                        {discount > 0 && (
                                            <span className="fav-discount">-{discount}%</span>
                                        )}
                                    </div>
                                    <div className="fav-colors">
                                        {(product.colors || []).slice(0, 4).map((c, i) => (
                                            <span
                                                key={i}
                                                className="mini-swatch"
                                                style={{ backgroundColor: c.name || c }}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
                                    <div className="fav-actions">
                                        <button
                                            className="fav-cart-btn"
                                            onClick={() => {
                                                const firstColor = product.colors && product.colors[0];
                                                addToCart(product, firstColor, firstColor?.name, 1);
                                                navigate("/cart");
                                            }}
                                        >
                                            <FiShoppingCart size={15} /> Move to Cart
                                        </button>
                                        <button
                                            className="fav-remove-btn"
                                            onClick={() => toggleFavorite(product)}
                                            title="Remove from favorites"
                                        >
                                            <FiTrash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FavoritesPage;
