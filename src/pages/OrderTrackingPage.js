import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FiArrowLeft, FiPackage, FiXCircle, FiAlertTriangle, FiDownload } from "react-icons/fi";
import { useOrders } from "../context/OrderContext";
import { downloadInvoice } from "../utils/downloadInvoice";
import "./OrderTrackingPage.css";

const CANCEL_REASONS = [
    "Product not comfortable / wrong fit",
    "Changed my mind",
    "Found a better price elsewhere",
    "Ordered by mistake",
    "Delivery time too long",
    "Other",
];

const OrderTrackingPage = () => {
    const { orderId } = useParams();
    const { getOrder, orders, STATUSES, cancelOrder, canCancel } = useOrders();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [cancelDone, setCancelDone] = useState(false);

    const order = getOrder(orderId);

    // ── My Orders List ──────────────────────────────────────────────
    if (!orderId) {
        return (
            <div className="tracking-page animate-fade-in">
                <div className="tracking-header">
                    <Link to="/" className="back-btn"><FiArrowLeft /> Home</Link>
                    <div>
                        <h1>My Orders</h1>
                        <p>Track all your StyleHub orders</p>
                    </div>
                </div>
                {orders.length === 0 ? (
                    <div className="no-orders">
                        <FiPackage size={64} />
                        <h2>No orders yet</h2>
                        <Link to="/" className="btn-primary">Start Shopping</Link>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map((o) => (
                            <Link to={`/track/${o.id}`} key={o.id} className={`order-card glass ${o.cancelled ? "cancelled-card" : ""}`}>
                                <div className="order-card-header">
                                    <div>
                                        <span className="order-id">{o.displayId || o.id}</span>
                                        <span className="order-date">{new Date(o.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                    </div>
                                    <span className="order-total">₹{o.total?.toLocaleString() || "0"}</span>
                                </div>
                                <div className="order-card-items">
                                    {o.items.slice(0, 2).map((item, i) => (
                                        <span key={i} className="order-item-chip">{item.name} ×{item.quantity}</span>
                                    ))}
                                    {o.items.length > 2 && <span className="order-item-chip muted">+{o.items.length - 2} more</span>}
                                </div>
                                <div className={`order-status-pill ${o.cancelled ? "cancelled-pill" : ""}`}>
                                    {o.cancelled
                                        ? "❌ Cancelled"
                                        : o.timeline.find((t) => !t.done)
                                            ? STATUSES.find((s) => s.key === o.timeline.find((t) => !t.done).status)?.label
                                            : "✅ Delivered"}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (!order) {
        return (
            <div className="tracking-page animate-fade-in">
                <div className="no-orders">
                    <FiPackage size={64} />
                    <h2>Order not found</h2>
                    <p>Order <strong>{orderId}</strong> does not exist.</p>
                    <Link to="/orders" className="btn-primary">My Orders</Link>
                </div>
            </div>
        );
    }

    const currentStatusIdx = order.timeline.filter((t) => t.done).length - 1;
    const eligible = canCancel(order);

    const handleConfirmCancel = () => {
        const reason = cancelReason === "Other" ? customReason : cancelReason;
        if (!reason.trim()) return;
        cancelOrder(order.id, reason);
        setCancelDone(true);
        setShowCancelModal(false);
    };

    // ── Single Order View ────────────────────────────────────────────
    return (
        <div className="tracking-page animate-fade-in">
            <div className="tracking-inner">
                <div className="tracking-header">
                    <Link to="/orders" className="back-btn"><FiArrowLeft /> My Orders</Link>
                    <div>
                        <h1>Order {order.displayId || order.id}</h1>
                        <p>Placed on {new Date(order.placed_at || order.placedAt).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                </div>

                {/* Cancelled Banner */}
                {(order.cancelled || cancelDone || order.status === 'cancelled') && (
                    <div className="cancelled-banner animate-slide-up">
                        <FiXCircle size={22} />
                        <div>
                            <strong>Order Cancelled</strong>
                            <p>Reason: {order.cancel_reason || order.cancelReason || cancelReason}</p>
                            {(order.cancelled_at || order.cancelledAt) && (
                                <p className="cancel-time">on {new Date(order.cancelled_at || order.cancelledAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="tracking-grid">
                    {/* Timeline */}
                    <div className="timeline-card glass">
                        <h2>Tracking Status</h2>
                        <div className={`timeline ${(order.cancelled || order.status === 'cancelled') ? "timeline-cancelled" : ""}`}>
                            {STATUSES.map((s, i) => {
                                const step = order.timeline.find((t) => t.status === s.key);
                                const isDone = Boolean(step);
                                const isCurrent = order.status === s.key;
                                return (
                                    <div key={s.key} className={`timeline-step ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`}>
                                        <div className="timeline-left">
                                            <div className="timeline-dot">
                                                {(order.cancelled || order.status === 'cancelled') ? "–" : isDone ? "✓" : s.icon}
                                            </div>
                                            {i < STATUSES.length - 1 && (
                                                <div className={`timeline-line ${isDone ? "done" : ""}`} />
                                            )}
                                        </div>
                                        <div className="timeline-right">
                                            <span className="timeline-label">{s.label}</span>
                                            {step?.time && (
                                                <span className="timeline-time">
                                                    {new Date(step.time).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            )}
                                            {isCurrent && <span className="timeline-pending-badge">In Progress</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Actions (Download / Cancel) */}
                        <div className="order-actions-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border)' }}>
                            {!(order.cancelled || order.status === 'cancelled') ? (
                                <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1.5px solid var(--border)' }} onClick={() => downloadInvoice(order)}>
                                    <FiDownload size={16} /> Download Receipt
                                </button>
                            ) : (
                                <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <FiXCircle size={16} /> Receipt unavailable for cancelled orders
                                </div>
                            )}

                            {/* Cancel CTA */}
                            {!(order.cancelled || order.status === 'cancelled') && !cancelDone && (
                                <div className="cancel-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                                    <button className="cancel-order-btn" onClick={() => setShowCancelModal(true)}>
                                        <FiXCircle size={16} /> Cancel Order
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="tracking-details">
                        <div className="detail-card glass">
                            <h3>Delivery Address</h3>
                            <p>{(order.shipping_address || order.shippingAddress)?.name || "Name not provided"}</p>
                            <p>{(order.shipping_address || order.shippingAddress)?.address || "Address not provided"}</p>
                            <p>
                                {(order.shipping_address || order.shippingAddress)?.city || "City"}
                                {(order.shipping_address || order.shippingAddress)?.zip ? `, ${(order.shipping_address || order.shippingAddress).zip}` : ""}
                            </p>
                        </div>

                        <div className="detail-card glass">
                            <h3>Payment</h3>
                            <p className="payment-chip">
                                {(order.payment_method || order.paymentMethod) === "upi" ? "📱 UPI / QR Code" :
                                    (order.payment_method || order.paymentMethod) === "cod" ? "💵 Cash on Delivery" :
                                        "💳 Card Payment"}
                            </p>
                        </div>

                        <div className="detail-card glass">
                            <h3>Order Items</h3>
                            <div className="order-items-list">
                                {order.items.map((item, i) => (
                                    <div key={i} className="order-item-row">
                                        <span>{item.name} <span className="item-qty">×{item.quantity}</span></span>
                                        <span>₹{(item.price * item.quantity)?.toLocaleString() ?? "0"}</span>
                                    </div>
                                ))}
                                <div className="order-item-row total-row">
                                    <span>Total</span>
                                    <span>₹{order.total?.toLocaleString() ?? "0"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="cancel-modal-overlay" onClick={() => setShowCancelModal(false)}>
                    <div className="cancel-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <div className="cancel-modal-icon">
                            <FiAlertTriangle size={36} color="#f59e0b" />
                        </div>
                        <h3>Cancel Order?</h3>
                        <p>Please let us know why you want to cancel <strong>{order.id}</strong>.</p>

                        <div className="reason-list">
                            {CANCEL_REASONS.map((r) => (
                                <label key={r} className={`reason-option ${cancelReason === r ? "selected" : ""}`}>
                                    <input
                                        type="radio"
                                        name="cancelReason"
                                        value={r}
                                        checked={cancelReason === r}
                                        onChange={() => setCancelReason(r)}
                                    />
                                    {r}
                                </label>
                            ))}
                        </div>

                        {cancelReason === "Other" && (
                            <textarea
                                className="custom-reason-input"
                                placeholder="Please describe your reason..."
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                rows={3}
                            />
                        )}

                        <div className="cancel-modal-actions">
                            <button className="keep-btn" onClick={() => setShowCancelModal(false)}>
                                Keep Order
                            </button>
                            <button
                                className="confirm-cancel-btn"
                                onClick={handleConfirmCancel}
                                disabled={!cancelReason || (cancelReason === "Other" && !customReason.trim())}
                            >
                                <FiXCircle size={15} /> Confirm Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderTrackingPage;
