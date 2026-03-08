export const downloadInvoice = (order) => {
    if (!order) {
        console.error("[Download] No order data provided.");
        alert("Unable to generate receipt: Order data is missing.");
        return;
    }

    const items = order.items || [];
    const shippingAddress = order.shipping_address || order.shippingAddress || {};
    const paymentMethod = order.payment_method || order.paymentMethod || "cod";
    const placedAt = order.created_at || order.placed_at || order.placedAt || new Date().toISOString();
    const total = Number(order.total_price || order.total || 0);
    const shippingCost = Number(order.shipping_cost || order.shipping || 0);
    const orderId = order.displayId || order.orderNumber || order.order_id || order.id || "N/A";

    const itemsText = items.map(
        (item) => {
            const name = item.product_name || item.name || item.product?.name || "Product";
            const qty = item.quantity || 1;
            const price = Number(item.price || item.product?.price || 0);
            const size = item.size_name || item.size?.name || item.size || "";
            const color = item.color_name || item.color?.name || item.color || "";

            let itemLine = `${name.padEnd(25, " ")} | Qty: ${qty}`;
            if (size) itemLine += ` | Size: ${size}`;
            if (color) itemLine += ` | Color: ${color}`;
            itemLine = itemLine.padEnd(55, " ") + ` | ₹${(price * qty).toLocaleString()}`;

            return itemLine;
        }
    ).join('\n');

    const text = `
============================================================
                  STYLEHUB ORDER RECEIPT              
============================================================
Order ID:    ${orderId}
Date:        ${new Date(placedAt).toLocaleString("en-IN")}
Status:      ${(order.is_cancelled || order.cancelled || order.status === 'cancelled') ? "❌ CANCELLED" : "✅ CONFIRMED"}
Payment:     ${paymentMethod === "upi" ? "UPI/QR Code" : paymentMethod === "card" ? "Credit/Debit Card" : "Cash on Delivery"}

------------------------------------------------------------
SHIPPING TO:
------------------------------------------------------------
${shippingAddress.name || "Customer"}
${shippingAddress.email || ""}
${shippingAddress.address || "Address not provided"}
${shippingAddress.city || ""}${shippingAddress.zip ? ` - ${shippingAddress.zip}` : ""}

------------------------------------------------------------
ORDER ITEMS:
------------------------------------------------------------
${itemsText || "No items listed"}

------------------------------------------------------------
Subtotal:    ₹${(total - shippingCost).toLocaleString()}
Shipping:    ${shippingCost === 0 ? "FREE" : `₹${shippingCost.toLocaleString()}`}
============================================================
TOTAL:       ₹${total.toLocaleString()}
============================================================

Thank you for shopping with StyleHub!
We hope you love your new clothes. For any queries,
please contact support@stylehub.com

Visit us again at: www.stylehub.com
============================================================
`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `StyleHub_Invoice_${orderId}.txt`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
