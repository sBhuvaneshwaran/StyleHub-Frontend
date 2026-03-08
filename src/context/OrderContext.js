import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { useAuth } from "./AuthContext";

const OrderContext = createContext();

const STATUSES = [
    { key: "placed", label: "Order Placed", icon: "📦" },
    { key: "confirmed", label: "Confirmed", icon: "✅" },
    { key: "packed", label: "Packed & Ready", icon: "📫" },
    { key: "shipped", label: "Shipped", icon: "🚚" },
    { key: "delivered", label: "Delivered", icon: "🏠" },
];

const normalizeOrder = (order) => {
    const placedAt = order.created_at || order.placed_at || order.placedAt || new Date().toISOString();

    // Map tracking_history to the format expected by the UI (timeline)
    const timeline = (order.tracking_history || []).map(t => ({
        status: t.status,
        time: t.created_at,
        done: true,
        message: t.message
    }));

    const status = order.status || "placed";
    const shippingAddress = order.shipping_address || order.shippingAddress || {};
    const paymentMethod = order.payment_method || order.paymentMethod || "cod";
    const total = Number(order.total_price || order.total || 0);
    const items = (order.items || []).map(i => ({
        ...i,
        name: i.product_name || i.name || "Product"
    }));

    return {
        ...order,
        // Database PK (integer) for API calls
        id: order.id,
        // Friendly ID (SH-XXXXXX) or fallback to ID
        displayId: String(order.order_number || order.order_id || order.id),
        orderNumber: String(order.order_number || order.order_id || order.id),
        total,
        total_price: total,
        placedAt,
        placed_at: placedAt,
        status,
        cancelled: Boolean(order.is_cancelled || order.cancelled || order.status === 'cancelled'),
        is_cancelled: Boolean(order.is_cancelled || order.cancelled || order.status === 'cancelled'),
        items,
        shippingAddress,
        shipping_address: shippingAddress,
        paymentMethod,
        payment_method: paymentMethod,
        timeline: timeline.length > 0 ? timeline : [
            { status: "placed", time: placedAt, done: true }
        ]
    };
};

export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const { user } = useAuth();

    const fetchOrders = async () => {
        if (!user) return;
        try {
            const res = await api.get("/api/store/orders/");
            const rawOrders = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setOrders(rawOrders.map(normalizeOrder));
        } catch (err) {
            console.error("[Orders] fetchOrders error:", err.response?.data || err.message);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [user]);

    const placeOrder = async ({ items, total, shipping, paymentMethod, shippingAddress }) => {
        try {
            const res = await api.post("/api/store/orders/", {
                items: items.map(i => ({
                    product_id: i.id,
                    quantity: i.quantity,
                    color_id: i.color_id || null,
                    size_id: i.size_id || null // Added size_id
                })),
                total,
                shipping_cost: shipping,
                payment_method: paymentMethod,
                shipping_address: shippingAddress,
            });

            const newOrder = normalizeOrder(res.data);
            setOrders(prev => [newOrder, ...prev]);
            return newOrder;
        } catch (err) {
            console.error("[Orders] placeOrder error:", err.response?.data || err.message);
            return null;
        }
    };

    const getOrder = (orderId) => {
        if (!orderId) return null;
        return orders.find(o =>
            String(o.id) === String(orderId) ||
            String(o.displayId) === String(orderId) ||
            String(o.orderNumber) === String(orderId)
        );
    };

    const canCancel = (order) => {
        if (!order || order.cancelled || order.status === "cancelled") return false;
        return true; // Anyone can cancel at any time if not already cancelled
    };

    const cancelOrder = async (orderId, reason) => {
        try {
            await api.post(`/api/store/orders/${orderId}/cancel/`, { reason });
            await fetchOrders();
        } catch (err) {
            console.error("[Orders] cancelOrder error:", err.response?.data || err.message);
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            await api.patch(`/api/store/orders/${orderId}/`, { status });
            await fetchOrders();
        } catch (err) {
            console.error("[Orders] updateOrderStatus error:", err.response?.data || err.message);
        }
    };

    const deleteOrder = async (orderId) => {
        try {
            await api.delete(`/api/store/orders/${orderId}/`);
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (err) {
            console.error("[Orders] deleteOrder error:", err.response?.data || err.message);
        }
    };

    return (
        <OrderContext.Provider value={{ orders, placeOrder, getOrder, cancelOrder, updateOrderStatus, deleteOrder, canCancel, STATUSES }}>
            {children}
        </OrderContext.Provider>
    );
};

export const useOrders = () => useContext(OrderContext);
