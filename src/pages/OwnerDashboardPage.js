import React, { useState } from "react";
import { FiPlus, FiX, FiPackage, FiCheck, FiTrash2, FiAlertTriangle, FiDownload, FiXCircle, FiEdit2 } from "react-icons/fi";
import { useProducts } from "../context/ProductContext";
import { useOrders } from "../context/OrderContext";
import { downloadInvoice } from "../utils/downloadInvoice";
import "./OwnerDashboardPage.css";

// Fixed category list — always shown. IDs are resolved against Django at save time.
const CATEGORIES = ["Men", "Women", "Kids", "Unisex"];

const PRESET_COLORS = [
    { hex: "#1C1C1C", name: "Jet Black" },
    { hex: "#FFFFFF", name: "White" },
    { hex: "#808080", name: "Gray" },
    { hex: "#000080", name: "Navy" },
    { hex: "#8B0000", name: "Maroon" },
    { hex: "#006400", name: "Dark Green" },
    { hex: "#FF6B9D", name: "Pink" },
    { hex: "#FFD700", name: "Yellow" },
    { hex: "#87CEEB", name: "Sky Blue" },
    { hex: "#FFA500", name: "Orange" },
    { hex: "#8B6914", name: "Khaki" },
    { hex: "#4B0082", name: "Indigo" },
];

const PRESET_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const emptyForm = {
    name: "",
    category: "",
    price: "",
    originalPrice: "",
    description: "",
    colors: [],
    colorNames: [],
    sizes: [], // Selected size objects {id, name}
    sizeIds: [],
    images: [""],
    flipkart: "",
    amazon: "",
};

const OwnerDashboardPage = () => {
    const { products, categories, sizes, addProduct, updateProduct, deleteProduct } = useProducts();
    const { orders, updateOrderStatus, cancelOrder, deleteOrder, STATUSES } = useOrders(); // Added deleteOrder
    const [form, setForm] = useState({ ...emptyForm, category: categories?.[0]?.name || "" });
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState({});
    const [deleteConfirm, setDeleteConfirm] = useState(null); // for products
    const [orderDeleteConfirm, setOrderDeleteConfirm] = useState(null); // for orders
    const [editingId, setEditingId] = useState(null);

    // Order Pagination
    const [orderPage, setOrderPage] = useState(1);
    const ordersPerPage = 5;
    const indexOfLastOrder = orderPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalOrderPages = Math.ceil(orders.length / ordersPerPage);

    // Auto-adjust page if current page is now empty (e.g. after deletion)
    if (orderPage > totalOrderPages && totalOrderPages > 0) {
        setOrderPage(totalOrderPages);
    }

    const ownerAddedProducts = products;

    const handleEdit = (p) => {
        setEditingId(p.id);
        setForm({
            name: p.name,
            category: p.category_name || p.category,
            price: p.price.toString(),
            originalPrice: p.originalPrice?.toString() || "",
            description: p.description || p.short_description || "",
            colors: p.colors || [],
            colorNames: (p.colors || []).map(c => c.name),
            sizes: p.sizes || [],
            sizeIds: (p.sizes || [])
                .map(s => typeof s === "object" ? s.id : s)
                .filter(Boolean),
            images: p.images?.length > 0 ? p.images.map(img => img.image || img) : [""],
            flipkart: p.flipkart || "",
            amazon: p.amazon || "",
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleColor = (hex, name) => {
        setForm((prev) => {
            const exists = prev.colors.some(c => c.name === name);
            if (exists) {
                const colors = prev.colors.filter((c) => c.name !== name);
                return { ...prev, colors, colorNames: colors.map(c => c.name) };
            }
            return {
                ...prev,
                colors: [...prev.colors, { name, hex }],
                colorNames: [...prev.colorNames, name],
            };
        });
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Product name is required.";
        if (!form.price || isNaN(form.price) || Number(form.price) <= 0)
            e.price = "Enter a valid price.";
        if (!form.originalPrice || isNaN(form.originalPrice) || Number(form.originalPrice) <= 0)
            e.originalPrice = "Enter a valid original price.";
        if (!form.description.trim()) e.description = "Description is required.";
        if (form.colors.length === 0) e.colors = "Select at least one color.";
        if (!form.images[0] || (typeof form.images[0] === 'string' && !form.images[0].trim())) e.images = "Enter at least one image.";
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const e2 = validate();
        if (Object.keys(e2).length > 0) { setErrors(e2); return; }
        setErrors({});

        const productData = {
            ...form,
            price: Number(form.price),
            originalPrice: Number(form.originalPrice),
            images: form.images.filter((u) => u && (typeof u === 'string' ? u.trim() : true)),
        };

        const success = editingId
            ? await updateProduct(editingId, productData)
            : await addProduct(productData);

        if (success) {
            setSuccess(true);
            setForm(emptyForm);
            setEditingId(null);
            setTimeout(() => setSuccess(false), 4000);
        } else {
            alert(`Failed to ${editingId ? "update" : "add"} product. Check console for details.`);
        }
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h1 className="page-title">Admin Dashboard</h1>
                        <p className="dashboard-sub">Manage your store products</p>
                    </div>
                    <div className="dashboard-stats">
                        <div className="dstat">
                            <strong>{products.length}</strong>
                            <span>Total Products</span>
                        </div>
                        <div className="dstat">
                            <strong>{ownerAddedProducts.length}</strong>
                            <span>Active Products</span>
                        </div>
                    </div>
                </div>

                {success && (
                    <div className="success-banner">
                        <FiCheck size={20} />
                        Product added successfully! It's now live in the store. 🎉
                    </div>
                )}

                <div className="dashboard-grid">
                    {/* Add Product Form */}
                    <div className="form-card">
                        <h2 className="form-title">
                            {editingId ? <><FiEdit2 size={20} /> Edit Product</> : <><FiPlus size={20} /> Add New Product</>}
                        </h2>
                        <form onSubmit={handleSubmit} className="product-form">
                            {/* Name */}
                            <div className={`form-group ${errors.name ? "has-error" : ""}`}>
                                <label>Product Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Floral Summer Dress"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                    minLength={3}
                                />
                                {errors.name && <span className="field-error">{errors.name}</span>}
                            </div>

                            {/* Category */}
                            <div className="form-group">
                                <label>Category *</label>
                                <div className="cat-chips">
                                    {(categories.length > 0 ? categories : [{ name: "Men" }, { name: "Women" }, { name: "Kids" }, { name: "Unisex" }]).map((cat) => {
                                        const catName = typeof cat === 'string' ? cat : cat.name;
                                        return (
                                            <button
                                                key={catName}
                                                type="button"
                                                className={`chip ${form.category === catName ? "chip-active" : ""}`}
                                                onClick={() => setForm({ ...form, category: catName })}
                                            >
                                                {catName}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="form-row">
                                <div className={`form-group ${errors.price ? "has-error" : ""}`}>
                                    <label>Selling Price (₹) *</label>
                                    <input
                                        type="number"
                                        placeholder="1299"
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        min="1"
                                        required
                                    />
                                    {errors.price && <span className="field-error">{errors.price}</span>}
                                </div>
                                <div className={`form-group ${errors.originalPrice ? "has-error" : ""}`}>
                                    <label>Original Price (₹) *</label>
                                    <input
                                        type="number"
                                        placeholder="1999"
                                        value={form.originalPrice}
                                        onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                                        min="1"
                                        required
                                    />
                                    {errors.originalPrice && <span className="field-error">{errors.originalPrice}</span>}
                                </div>
                            </div>

                            {/* Description */}
                            <div className={`form-group ${errors.description ? "has-error" : ""}`}>
                                <label>Description *</label>
                                <textarea
                                    placeholder="Describe the product..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    required
                                    minLength={10}
                                />
                                {errors.description && <span className="field-error">{errors.description}</span>}
                            </div>

                            {/* Sizes */}
                            <div className="form-group">
                                <label>Available Sizes *</label>

                                <div className="cat-chips">
                                    {sizes.map((s) => {
                                        const isSelected = form.sizeIds.includes(s.id);

                                        return (
                                            <button
                                                key={s.id}
                                                type="button"
                                                className={`chip ${isSelected ? "chip-active" : ""}`}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            sizeIds: prev.sizeIds.filter(id => id !== s.id),
                                                            sizes: prev.sizes.filter(sz => sz.id !== s.id),
                                                        }));
                                                    } else {
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            sizeIds: [...prev.sizeIds, s.id],
                                                            sizes: [...prev.sizes, s],
                                                        }));
                                                    }
                                                }}
                                            >
                                                {s.name}
                                            </button>
                                        );
                                    })}
                                </div>

                                {form.sizes.length > 0 && (
                                    <div className="selected-colors-label">
                                        Selected: {form.sizes.map(s => s.name).join(", ")}
                                    </div>
                                )}
                            </div>

                            {/* Colors */}
                            <div className={`form-group ${errors.colors ? "has-error" : ""}`}>
                                <label>Available Colors * <span className="label-hint">(select all that apply)</span></label>
                                <div className="color-picker-grid">
                                    {PRESET_COLORS.map((c) => (
                                        <button
                                            key={c.hex}
                                            type="button"
                                            className={`color-option ${form.colorNames.includes(c.name) ? "color-selected" : ""}`}
                                            style={{ background: c.hex }}
                                            title={c.name}
                                            onClick={() => toggleColor(c.hex, c.name)}
                                        >
                                            {form.colorNames.includes(c.name) && (
                                                <FiCheck
                                                    size={14}
                                                    color={
                                                        c.hex === "#FFFFFF" || c.hex === "#FFD700"
                                                            ? "#333"
                                                            : "white"
                                                    }
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {form.colors.length > 0 && (
                                    <div className="selected-colors-label">
                                        Selected: {form.colorNames.join(", ")}
                                    </div>
                                )}
                                {errors.colors && <span className="field-error">{errors.colors}</span>}
                            </div>

                            {/* Image URLs/Upload */}
                            <div className={`form-group ${errors.images ? "has-error" : ""}`}>
                                <label>Product Images *</label>
                                <div className="image-inputs">
                                    <div className="upload-box-wrapper">
                                        <label className="upload-box">
                                            <FiPlus size={24} />
                                            <span>Upload Image</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files);
                                                    files.forEach((file) => {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                images: [...prev.images.filter(img => img), reader.result],
                                                            }));
                                                        };
                                                        reader.readAsDataURL(file);
                                                    });
                                                }}
                                                hidden
                                            />
                                        </label>
                                    </div>

                                    {form.images.map((url, i) => url && (
                                        <div key={i} className="image-preview-card animate-scale-in">
                                            <img src={url} alt={`Preview ${i}`} />
                                            <button
                                                type="button"
                                                className="remove-img-badge"
                                                onClick={() =>
                                                    setForm({
                                                        ...form,
                                                        images: form.images.filter((_, j) => j !== i),
                                                    })
                                                }
                                            >
                                                <FiX size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="url-input-alt">
                                    <p className="label-hint">Or provide Image URLs:</p>
                                    {form.images.map((url, i) => (
                                        <div key={i} className="image-row">
                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                value={url && typeof url === 'string' ? url : ''}
                                                onChange={(e) => {
                                                    const imgs = [...form.images];
                                                    imgs[i] = e.target.value;
                                                    setForm({ ...form, images: imgs });
                                                }}
                                            />
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="add-img-btn"
                                        onClick={() => setForm({ ...form, images: [...form.images, ""] })}
                                    >
                                        <FiPlus size={14} /> Add URL Field
                                    </button>
                                </div>
                                {errors.images && <span className="field-error">{errors.images}</span>}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="submit-btn" disabled={success} style={{ flex: 1 }}>
                                    {editingId ? <><FiCheck size={18} /> Update Product</> : <><FiPackage size={18} /> Publish Product</>}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => { setEditingId(null); setForm(emptyForm); }}
                                        style={{ flex: 0.5 }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Owner Added Products */}
                    <div className="owned-products">
                        <h2 className="form-title">Products Added by You</h2>
                        {ownerAddedProducts.length === 0 ? (
                            <div className="no-owned">
                                <span>📦</span>
                                <p>No products added yet. Use the form to publish your first product!</p>
                            </div>
                        ) : (
                            <div className="owned-list">
                                {ownerAddedProducts.map((p) => (
                                    <div className="owned-item" key={p.id}>
                                        <img src={p.image || (p.images && p.images[0]?.image)} alt={p.name} className="owned-img" />
                                        <div className="owned-info">
                                            <span className="owned-category">{p.category_name || p.category}</span>
                                            <h4 className="owned-name">{p.name}</h4>
                                            <div className="owned-pricing">
                                                <span className="o-price">₹{p.price?.toLocaleString()}</span>
                                                {p.originalPrice && <span className="o-original">₹{p.originalPrice.toLocaleString()}</span>}
                                            </div>
                                            <div className="owned-colors">
                                                {(p.colors || []).map((c, i) => (
                                                    <span
                                                        key={i}
                                                        className="mini-swatch"
                                                        style={{ backgroundColor: c.name || c }}
                                                        title={c.name}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="owned-actions">
                                            <span className="live-badge">● Live</span>
                                            <button
                                                className="edit-product-btn"
                                                onClick={() => handleEdit(p)}
                                                title="Edit product"
                                                style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                            >
                                                <FiEdit2 size={15} />
                                            </button>
                                            <button
                                                className="delete-product-btn"
                                                onClick={() => setDeleteConfirm(p.id)}
                                                title="Delete product"
                                            >
                                                <FiTrash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Customer Orders */}
                    <div className="owned-orders" style={{ marginTop: '2rem' }}>
                        <h2 className="form-title">Recent Customer Orders</h2>
                        {orders.length === 0 ? (
                            <div className="no-owned">
                                <span>🛒</span>
                                <p>No orders placed yet.</p>
                            </div>
                        ) : (
                            <>
                                <div className="owned-list">
                                    {currentOrders.map((o) => (
                                        <div className="owned-item" key={o.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <h4 className="owned-name" style={{ margin: 0 }}>Order {o.displayId || o.id}</h4>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                                        {new Date(o.placed_at || o.placedAt).toLocaleDateString()} • {o.items?.length || 0} item(s) • ₹{o.total?.toLocaleString()}
                                                    </span>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
                                                        {(o.cancelled || o.status === 'cancelled') ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                                <span style={{ color: 'var(--danger)' }}>Cancelled</span>
                                                                <button
                                                                    onClick={() => setOrderDeleteConfirm(o.id)}
                                                                    title="Delete Order Record"
                                                                    style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                                                                >
                                                                    <FiTrash2 size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                                <select
                                                                    value={o.status || 'placed'}
                                                                    onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                                                    style={{
                                                                        padding: '0.3rem 0.5rem',
                                                                        borderRadius: '6px',
                                                                        border: '1px solid var(--border)',
                                                                        background: 'white',
                                                                        fontSize: '0.85rem'
                                                                    }}
                                                                >
                                                                    {STATUSES.map(s => (
                                                                        <option key={s.key} value={s.key}>{s.label}</option>
                                                                    ))}
                                                                    <option value="cancelled">Cancelled</option>
                                                                </select>
                                                                <span style={{ color: 'var(--success)', fontWeight: 500 }}>
                                                                    Current: {STATUSES.find(s => s.key === o.status)?.label || o.status}
                                                                </span>
                                                                <button
                                                                    onClick={() => {
                                                                        if (window.confirm(`Are you sure you want to cancel Order ${o.id}?`)) {
                                                                            cancelOrder(o.id, "Cancelled by Admin");
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        padding: '0.3rem 0.6rem',
                                                                        background: 'var(--danger-soft)',
                                                                        color: 'var(--danger)',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.8rem',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.3rem'
                                                                    }}
                                                                >
                                                                    <FiXCircle size={14} /> Cancel Order
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                                                    {!(o.cancelled || o.status === 'cancelled') && (
                                                        <button
                                                            className="btn-secondary"
                                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                                            onClick={() => downloadInvoice(o)}
                                                        >
                                                            <FiDownload size={14} /> Download Receipt
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setOrderDeleteConfirm(o.id)}
                                                        className="delete-product-btn"
                                                        style={{ padding: '4px', background: 'transparent' }}
                                                        title="Permanently Delete Order"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {totalOrderPages > 1 && (
                                    <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', paddingBottom: '1rem' }}>
                                        <button
                                            className="chip"
                                            disabled={orderPage === 1}
                                            onClick={() => setOrderPage(prev => prev - 1)}
                                        >
                                            Prev
                                        </button>
                                        {[...Array(totalOrderPages)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                className={`chip ${orderPage === i + 1 ? "chip-active" : ""}`}
                                                onClick={() => setOrderPage(i + 1)}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            className="chip"
                                            disabled={orderPage === totalOrderPages}
                                            onClick={() => setOrderPage(prev => prev + 1)}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal for Products */}
            {deleteConfirm && (
                <div className="delete-modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="delete-modal-icon">
                            <FiAlertTriangle size={32} color="var(--danger)" />
                        </div>
                        <h3>Delete Product?</h3>
                        <p>This action cannot be undone. The product will be permanently removed from your store.</p>
                        <div className="delete-modal-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="confirm-delete-btn"
                                onClick={() => {
                                    deleteProduct(deleteConfirm);
                                    setDeleteConfirm(null);
                                }}
                            >
                                <FiTrash2 size={15} /> Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal for Orders */}
            {orderDeleteConfirm && (
                <div className="delete-modal-overlay" onClick={() => setOrderDeleteConfirm(null)}>
                    <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="delete-modal-icon">
                            <FiAlertTriangle size={32} color="var(--danger)" />
                        </div>
                        <h3>Delete Order Record?</h3>
                        <p>Are you sure you want to permanently delete <strong>Order {orderDeleteConfirm}</strong>? This action is irreversible.</p>
                        <div className="delete-modal-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => setOrderDeleteConfirm(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="confirm-delete-btn"
                                onClick={() => {
                                    deleteOrder(orderDeleteConfirm);
                                    setOrderDeleteConfirm(null);
                                }}
                            >
                                <FiTrash2 size={15} /> Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboardPage;
