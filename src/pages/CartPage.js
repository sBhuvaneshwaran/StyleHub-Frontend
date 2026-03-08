import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "./CartPage.css";

const CartPage = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        return (
            <div className="empty-page">
                <FiShoppingBag size={64} />
                <h2>Please login to view your cart</h2>
                <Link to="/login" className="btn-primary">Login</Link>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="empty-page">
                <span className="empty-icon">🛒</span>
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added anything yet!</p>
                <Link to="/" className="btn-primary">Start Shopping</Link>
            </div>
        );
    }

    const shipping = cartTotal >= 999 ? 0 : 79;
    const total = cartTotal + shipping;

    return (
        <div className="cart-page">
            <div className="cart-container">
                <h1 className="page-title">Shopping Cart <span>({cart.length} items)</span></h1>

                <div className="cart-grid">
                    {/* Cart Items */}
                    <div className="cart-items">
                        {cart.map((item) => (
                            <div className="cart-item" key={item.cartItemId}>
                                <Link to={`/product/${item.id}`}>
                                    <img src={item.image} alt={item.name} className="item-image" />
                                </Link>
                                <div className="item-details">
                                    <Link to={`/product/${item.id}`}>
                                        <h3 className="item-name">{item.name}</h3>
                                    </Link>
                                    <div className="item-meta">
                                        <span className="item-color-pill" style={{ backgroundColor: item.color }} />
                                        <span className="item-color-name">{item.color}</span>
                                        {item.size && (
                                            <>
                                                <span className="bullet">•</span>
                                                <span className="item-size">Size: {item.size}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="item-bottom">
                                        <div className="qty-control">
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                            >
                                                <FiMinus size={12} />
                                            </button>
                                            <span className="qty-val">{item.quantity}</span>
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                            >
                                                <FiPlus size={12} />
                                            </button>
                                        </div>
                                        <span className="item-price">
                                            ₹{(item.price * item.quantity).toLocaleString()}
                                        </span>
                                        <button
                                            className="remove-btn"
                                            onClick={() => removeFromCart(item.cartItemId)}
                                            title="Remove item"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="order-summary">
                        <h2 className="summary-title">Order Summary</h2>
                        <div className="summary-rows">
                            <div className="summary-row">
                                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                                <span>₹{cartTotal.toLocaleString()}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span className={shipping === 0 ? "free-shipping" : ""}>
                                    {shipping === 0 ? "FREE" : `₹${shipping}`}
                                </span>
                            </div>
                            {cartTotal < 999 && (
                                <p className="free-ship-hint">
                                    Add ₹{(999 - cartTotal).toLocaleString()} more for free shipping!
                                </p>
                            )}
                        </div>
                        <div className="summary-divider" />
                        <div className="summary-total">
                            <span>Total</span>
                            <span>₹{total.toLocaleString()}</span>
                        </div>
                        <button
                            className="checkout-btn"
                            onClick={() => navigate("/checkout")}
                        >
                            Proceed to Checkout →
                        </button>
                        <Link to="/" className="continue-link">
                            ← Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
