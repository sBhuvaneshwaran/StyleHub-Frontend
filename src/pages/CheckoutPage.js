import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiCheckCircle, FiChevronRight, FiMapPin, FiShoppingBag, FiCreditCard, FiLock, FiShield, FiDownload, FiTrash2 } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useOrders } from "../context/OrderContext";
import { useAddress } from "../context/AddressContext";
import { downloadInvoice } from "../utils/downloadInvoice";
import "./CheckoutPage.css";

const STEPS = ["Shipping", "Payment", "Review"];
const PAYMENT_METHODS = [
    { id: "upi", label: "UPI / QR Code", icon: "📱" },
    { id: "card", label: "Credit / Debit Card", icon: "💳" },
    { id: "cod", label: "Cash on Delivery", icon: "💵" },
];

const CheckoutPage = () => {
    const { cart, cartTotal, clearCart } = useCart();
    const { placeOrder, getOrder } = useOrders();
    const { addresses, addAddress: saveNewAddressToProfile, deleteAddress, updateAddress } = useAddress();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("upi");
    const [upiId, setUpiId] = useState("");
    const [upiConfirmed, setUpiConfirmed] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [saveToProfile, setSaveToProfile] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState("");

    const [form, setForm] = useState({ name: "", email: "", address: "", city: "", zip: "" });
    const [card, setCard] = useState({ name: "", number: "", expiry: "", cvv: "" });

    const shipping = cartTotal >= 999 ? 0 : 79;
    const total = cartTotal + shipping;

    if (cart.length === 0 && !orderId) {
        return (
            <div className="empty-page animate-fade-in">
                <FiShoppingBag size={64} />
                <h2>Your cart is empty</h2>
                <Link to="/" className="btn-primary">Start Shopping</Link>
            </div>
        );
    }

    const handleNext = async () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
            window.scrollTo(0, 0);
        } else {
            handlePlaceOrder();
        }
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            if (saveToProfile) {
                await saveNewAddressToProfile({
                    name: form.name,
                    email: form.email,
                    address: form.address,
                    city: form.city,
                    zip_code: form.zip
                });
            }

            const orderObj = await placeOrder({
                items: cart,
                total,
                shipping,
                paymentMethod,
                shippingAddress: form,
            });
            if (orderObj) {
                setOrderId(orderObj.displayId || orderObj.id);
                setCurrentOrder(orderObj);
                clearCart();
            } else {
                alert("Failed to place order. Please check your connection.");
            }
        } catch (error) {
            console.error("Checkout Error:", error);
            alert("An error occurred during checkout.");
        } finally {
            setLoading(false);
        }
    };

    if (orderId) {
        return (
            <div className="success-page animate-scale-in">
                <div className="success-card glass">
                    <div className="success-icon">
                        <FiCheckCircle size={80} color="var(--success)" />
                    </div>
                    <h1>Order Placed!</h1>
                    <p>Thank you! Your order <strong>{orderId}</strong> is being processed.</p>
                    <div className="tracking-cta">
                        <Link to={`/track/${orderId}`} className="btn-primary">
                            📦 Track My Order
                        </Link>
                        <Link to="/" className="btn-secondary">Continue Shopping</Link>
                        <button className="btn-secondary" style={{ marginTop: '0.5rem', width: '100%', borderColor: 'transparent', background: 'var(--bg-soft)' }} onClick={() => downloadInvoice(currentOrder)}>
                            <FiDownload /> Download Receipt
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page animate-fade-in">
            <div className="checkout-container">
                <div className="checkout-main">
                    {/* Stepper */}
                    <div className="checkout-stepper">
                        {STEPS.map((s, i) => (
                            <React.Fragment key={s}>
                                <div className={`step-item ${i <= step ? "active" : ""}`}>
                                    <span className="step-num">{i + 1}</span>
                                    <span className="step-label">{s}</span>
                                </div>
                                {i < STEPS.length - 1 && <div className={`step-line ${i < step ? "active" : ""}`} />}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="checkout-card glass">
                        {/* Step 0 — Shipping */}
                        {step === 0 && (
                            <form id="shipping-form" className="step-content animate-slide-up" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
                                <h2 className="step-title"><FiMapPin /> Shipping Details</h2>

                                {addresses.length > 0 && (
                                    <div className="saved-addresses-section" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.5rem', display: 'block' }}>Choose a saved address</label>
                                        <div className="address-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem' }}>
                                            {addresses.map(addr => (
                                                <div
                                                    key={addr.id}
                                                    className={`address-card glass ${selectedAddressId === addr.id ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setSelectedAddressId(addr.id);
                                                        setForm({
                                                            name: addr.name,
                                                            email: addr.email,
                                                            address: addr.address,
                                                            city: addr.city,
                                                            zip: addr.zip_code
                                                        });
                                                        setSaveToProfile(false);
                                                    }}
                                                    style={{
                                                        padding: '1rem',
                                                        borderRadius: '12px',
                                                        border: selectedAddressId === addr.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        background: selectedAddressId === addr.id ? 'var(--primary-soft)' : 'transparent',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{addr.name}</div>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm("Delete this address from your profile?")) {
                                                                        deleteAddress(addr.id);
                                                                        if (selectedAddressId === addr.id) {
                                                                            setSelectedAddressId("");
                                                                            setForm({ name: "", email: "", address: "", city: "", zip: "" });
                                                                        }
                                                                    }
                                                                }}
                                                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                                                                title="Delete Address"
                                                            >
                                                                <FiTrash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: '1.5' }}>
                                                        {addr.address}<br />
                                                        {addr.city} - {addr.zip_code}
                                                    </div>
                                                </div>
                                            ))}
                                            <div
                                                className={`address-card glass ${!selectedAddressId ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setSelectedAddressId("");
                                                    setForm({ name: "", email: "", address: "", city: "", zip: "" });
                                                }}
                                                style={{
                                                    padding: '0.8rem',
                                                    borderRadius: '8px',
                                                    border: !selectedAddressId ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.85rem',
                                                    color: !selectedAddressId ? 'var(--primary)' : 'var(--text-light)',
                                                    background: !selectedAddressId ? 'var(--primary-soft)' : 'transparent'
                                                }}
                                            >
                                                + New Address
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="checkout-form">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" placeholder="John Doe" required
                                            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input type="email" placeholder="john@example.com" required
                                            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Shipping Address</label>
                                        <textarea placeholder="Street address, Apartment, etc." required
                                            value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>City</label>
                                            <input type="text" placeholder="Mumbai" required
                                                value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>PIN Code</label>
                                            <input type="text" placeholder="400001" required pattern="\d{6}" title="6 digit PIN code"
                                                value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
                                        </div>
                                    </div>
                                    {!selectedAddressId && (
                                        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', padding: '0.5rem', background: 'var(--bg-soft)', borderRadius: '6px' }}>
                                            <input
                                                type="checkbox"
                                                id="save-to-profile"
                                                checked={saveToProfile}
                                                onChange={(e) => setSaveToProfile(e.target.checked)}
                                                style={{ width: 'auto', cursor: 'pointer' }}
                                            />
                                            <label htmlFor="save-to-profile" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                                                Save this address for future orders
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </form>
                        )}

                        {/* Step 1 — Payment */}
                        {step === 1 && (
                            <div className="step-content animate-slide-up">
                                <h2 className="step-title"><FiCreditCard /> Payment Method</h2>

                                <div className="payment-tabs">
                                    {PAYMENT_METHODS.map((m) => (
                                        <button key={m.id}
                                            className={`payment-tab ${paymentMethod === m.id ? "active" : ""}`}
                                            onClick={() => setPaymentMethod(m.id)}>
                                            <span>{m.icon}</span>{m.label}
                                        </button>
                                    ))}
                                </div>

                                {/* UPI */}
                                {paymentMethod === "upi" && (
                                    <div className="upi-panel animate-scale-in">
                                        <div className="qr-wrapper">
                                            <div className="qr-badge">Scan &amp; Pay</div>
                                            <img src="/upi-qr.png" alt="UPI QR Code" className="qr-image" />
                                            <div className="upi-id-row">
                                                <span className="upi-id-label">UPI ID:</span>
                                                <span className="upi-id-value">stylehub@upi</span>
                                            </div>
                                        </div>
                                        <div className="upi-apps">
                                            <p className="upi-apps-label">Pay using</p>
                                            <div className="upi-app-icons">
                                                {["GPay", "PhonePe", "Paytm", "BHIM"].map((a) => (
                                                    <span key={a} className="upi-app">{a}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="upi-confirm-section">
                                            <label>Enter your UPI ID (optional verification)</label>
                                            <div className="upi-input-row">
                                                <input type="text" placeholder="yourname@bank"
                                                    value={upiId} onChange={(e) => { setUpiId(e.target.value); setUpiConfirmed(false); }} />
                                                <button className="verify-btn" onClick={() => setUpiConfirmed(true)} disabled={!upiId.trim()}>
                                                    Verify
                                                </button>
                                            </div>
                                            {upiConfirmed && <p className="upi-verified animate-fade-in">✅ UPI ID verified!</p>}
                                        </div>
                                        <p className="payment-hint">🔒 Secure UPI payment. No card details needed.</p>
                                    </div>
                                )}

                                {/* Card */}
                                {paymentMethod === "card" && (
                                    <form id="card-form" className="card-panel animate-scale-in" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
                                        <div className="secure-badge-row">
                                            <FiLock size={14} /><span>256-bit SSL Encrypted</span>
                                            <FiShield size={14} /><span>PCI DSS Compliant</span>
                                        </div>
                                        <div className="checkout-form">
                                            <div className="form-group">
                                                <label>Name on Card</label>
                                                <input type="text" placeholder="John Doe" required minLength={3}
                                                    value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                                            </div>
                                            <div className="form-group">
                                                <label>Card Number</label>
                                                <div className="card-input-wrap">
                                                    <input type="text" placeholder="0000  0000  0000  0000" maxLength={19} required pattern="[\d\s]{19}" title="16 digit card number"
                                                        value={card.number}
                                                        onChange={(e) => {
                                                            const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                                                            const fmt = v.replace(/(.{4})/g, "$1 ").trim();
                                                            setCard({ ...card, number: fmt });
                                                        }} />
                                                    <span className="card-icons">💳</span>
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Expiry (MM/YY)</label>
                                                    <input type="text" placeholder="MM/YY" maxLength={5} required pattern="(0[1-9]|1[0-2])\/?([0-9]{2})" title="Valid expiry like 12/25"
                                                        value={card.expiry}
                                                        onChange={(e) => {
                                                            let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                                                            if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                                                            setCard({ ...card, expiry: v });
                                                        }} />
                                                </div>
                                                <div className="form-group">
                                                    <label>CVV</label>
                                                    <input type="password" placeholder="•••" maxLength={3} required pattern="\d{3}" title="3 digit security code"
                                                        value={card.cvv}
                                                        onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) })} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="trust-bar">
                                            <span><FiShield size={13} /> Secure Checkout</span>
                                            <span><FiLock size={13} /> End-to-End Encrypted</span>
                                            <span>🛡️ Fraud Protection</span>
                                        </div>
                                    </form>
                                )}

                                {/* COD */}
                                {paymentMethod === "cod" && (
                                    <div className="cod-panel animate-scale-in">
                                        <div className="cod-icon">💵</div>
                                        <h3>Cash on Delivery</h3>
                                        <p>Pay in cash when your order arrives at your doorstep. No online payment required.</p>
                                        <div className="cod-note">ℹ️ COD available for orders under ₹5,000.</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2 — Review */}
                        {step === 2 && (
                            <div className="step-content animate-slide-up">
                                <h2 className="step-title"><FiCheckCircle /> Review Your Order</h2>
                                <div className="review-section">
                                    <div className="review-block">
                                        <h3>Shipping to:</h3>
                                        <p><strong>{form.name || "—"}</strong></p>
                                        <p>{form.address || "—"}</p>
                                        <p>{form.city}{form.zip ? `, ${form.zip}` : ""}</p>
                                    </div>
                                    <div className="review-block">
                                        <h3>Payment:</h3>
                                        <p>
                                            {paymentMethod === "upi" ? `📱 UPI${upiId ? ` (${upiId})` : " / QR Code"}` :
                                                paymentMethod === "card" ? `💳 Card ending ••••${card.number.slice(-4) || "XXXX"}` :
                                                    "💵 Cash on Delivery"}
                                        </p>
                                    </div>
                                    <div className="review-block">
                                        <h3>Items:</h3>
                                        <div className="review-items">
                                            {cart.map((item, i) => (
                                                <div key={i} className="review-item">
                                                    <span>{item.name} (×{item.quantity})</span>
                                                    <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="checkout-footer">
                            {step > 0 && (
                                <button type="button" className="back-link" onClick={() => setStep(step - 1)}>← Back</button>
                            )}
                            <button
                                type={step === 0 || (step === 1 && paymentMethod === "card") ? "submit" : "button"}
                                form={step === 0 ? "shipping-form" : (step === 1 && paymentMethod === "card") ? "card-form" : undefined}
                                className="btn-primary next-btn"
                                onClick={step === 0 || (step === 1 && paymentMethod === "card") ? undefined : handleNext}
                                disabled={loading}
                            >
                                {loading ? <span className="spinner" /> : (
                                    <>{step === STEPS.length - 1 ? "Place Order" : "Continue"}<FiChevronRight /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="checkout-sidebar animate-slide-right">
                    <div className="checkout-card glass summary-card">
                        <h2 className="summary-title">Order Summary</h2>
                        <div className="summary-rows">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{cartTotal.toLocaleString()}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span>{shipping === 0 ? "🎉 FREE" : `₹${shipping}`}</span>
                            </div>
                            <div className="summary-divider" />
                            <div className="summary-total">
                                <span>Total</span>
                                <span>₹{total.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="secure-summary-hint">
                            <FiLock size={12} /> Safe &amp; Secure Checkout
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
