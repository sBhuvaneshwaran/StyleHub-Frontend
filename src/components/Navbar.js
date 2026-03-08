 import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiShoppingCart, FiHeart, FiLogOut, FiUser, FiPackage } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Navbar.css";

const Navbar = () => {
    const { user, logout } = useAuth();
    const { cartCount, favorites } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-logo">
                    <span className="logo-icon">👗</span>
                    <span className="logo-text">StyleHub</span>
                </Link>

                <div className="navbar-links">
                    <Link to="/" className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>
                        Home
                    </Link>
                    {user?.role === "owner" && (
                        <Link to="/dashboard" className={`nav-link ${location.pathname === "/dashboard" ? "active" : ""}`}>
                            <FiPackage size={16} /> Dashboard
                        </Link>
                    )}
                    {user?.role === "customer" && (
                        <Link to="/orders" className={`nav-link ${location.pathname.startsWith("/orders") || location.pathname.startsWith("/track") ? "active" : ""}`}>
                            📦 My Orders
                        </Link>
                    )}
                </div>

                <div className="navbar-actions">
                    {user && (
                        <>
                            <Link to="/favorites" className="action-btn" title="Favorites">
                                <FiHeart size={20} />
                                {favorites.length > 0 && (
                                    <span className="badge">{favorites.length}</span>
                                )}
                            </Link>
                            <Link to="/cart" className="action-btn" title="Cart">
                                <FiShoppingCart size={20} />
                                {cartCount > 0 && (
                                    <span className="badge cart-badge">{cartCount}</span>
                                )}
                            </Link>
                        </>
                    )}

                    {user ? (
                        <div className="user-menu">
                            <div className="user-avatar">{user.avatar}</div>
                            <div className="user-info">
                                <span className="user-name">{user.username}</span>
                                <span className="user-role">{user.role}</span>
                            </div>
                            <button className="logout-btn" onClick={handleLogout} title="Logout">
                                <FiLogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="login-nav-btn">
                            <FiUser size={16} /> Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
