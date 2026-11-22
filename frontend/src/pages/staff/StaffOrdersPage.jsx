import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './StaffOrdersPage.css';

const emptyProduct = { title: '', category: '', price: '', stock: '', imageUrl: '' };
const statuses = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered'];
const formatCurrency = (value) => `LKR ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-LK', { dateStyle: 'medium' }) : '—';
const getProblemMessage = (error, fallback) => error.response?.data?.detail || error.response?.data?.message || fallback;

function StatusPill({ status }) {
  return <span className={`status-pill status-${status.toLowerCase()}`}>{status}</span>;
}

function EmptyState({ children }) {
  return <div className="staff-empty-state">{children}</div>;
}

export default function StaffOrdersPage() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [productForm, setProductForm] = useState(emptyProduct);
  const [busyAction, setBusyAction] = useState('');

  const notify = (type, text) => {
    setFeedback({ type, text });
    window.setTimeout(() => setFeedback(null), 4200);
  };

  const loadOperations = async () => {
    setLoading(true);
    const [ordersResult, productsResult] = await Promise.allSettled([api.get('/orders'), api.get('/products')]);
    if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value.data);
    if (productsResult.status === 'fulfilled') setProducts(productsResult.value.data);
    if (ordersResult.status === 'rejected' || productsResult.status === 'rejected') notify('error', 'Operational data could not be fully loaded.');
    setLoading(false);
  };

  useEffect(() => { loadOperations(); }, []);

  const awaitingFulfillment = orders.filter((order) => ['Pending', 'Processing'].includes(order.status)).length;
  const inTransit = orders.filter((order) => order.status === 'Shipped').length;
  const lowStockProducts = products.filter((product) => product.stock <= 5);
  const visibleOrders = useMemo(() => filter === 'All' ? orders : orders.filter((order) => order.status === filter), [orders, filter]);

  const updateStatus = async (orderId, status) => {
    setBusyAction(`order-${orderId}`);
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status });
      setOrders((current) => current.map((order) => order._id === orderId ? response.data.updated : order));
      notify('success', `Order moved to ${status}.`);
    } catch (error) { notify('error', getProblemMessage(error, 'Order status could not be updated.')); }
    finally { setBusyAction(''); }
  };

  const restockProduct = async (event) => {
    event.preventDefault();
    const product = modal?.product;
    const amount = Number(restockAmount);
    if (!product || !Number.isInteger(amount) || amount < 1) return notify('error', 'Enter a whole number greater than zero.');
    setBusyAction('restock');
    try {
      const response = await api.patch(`/products/${product._id}`, { stock: product.stock + amount });
      setProducts((current) => current.map((item) => item._id === product._id ? response.data : item));
      setModal(null); setRestockAmount(''); notify('success', `${product.title} restocked with ${amount} units.`);
    } catch (error) { notify('error', getProblemMessage(error, 'Stock could not be updated.')); }
    finally { setBusyAction(''); }
  };

  const addProduct = async (event) => {
    event.preventDefault(); setBusyAction('product');
    try {
      const response = await api.post('/products', { ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) });
      setProducts((current) => [response.data, ...current]); setProductForm(emptyProduct); setModal(null); notify('success', 'New product added to the catalog.');
    } catch (error) { notify('error', getProblemMessage(error, 'Product could not be added.')); }
    finally { setBusyAction(''); }
  };

  const availableTransitions = (status) => {
    if (status === 'Pending') return ['Pending', 'Processing', 'Cancelled'];
    if (status === 'Processing') return ['Processing', 'Shipped', 'Cancelled'];
    if (status === 'Shipped') return ['Shipped', 'Delivered'];
    return [status];
  };

  return <main className="staff-shell"><aside className="staff-sidebar"><div className="staff-brand"><span className="staff-brand-mark">⚡</span><div><strong>MyShop</strong><span>Operations center</span></div></div><div className="staff-user"><span className="staff-avatar">{user?.name?.slice(0, 1).toUpperCase() || 'S'}</span><div><strong>{user?.name || 'Operations staff'}</strong><span>{user?.role || 'staff'} access</span></div></div><nav className="staff-nav" aria-label="Operations sections"><button className={activeView === 'orders' ? 'staff-nav-item active' : 'staff-nav-item'} onClick={() => setActiveView('orders')}><span>▤</span>Active orders</button><button className={activeView === 'inventory' ? 'staff-nav-item active' : 'staff-nav-item'} onClick={() => setActiveView('inventory')}><span>◇</span>Inventory & stock</button></nav><div className="staff-sidebar-footer"><span className="online-dot" /> Operations online</div></aside><section className="staff-main"><header className="staff-header"><div><p className="staff-eyebrow">Operations workspace</p><h1>{activeView === 'orders' ? 'Orders & fulfillment' : 'Inventory & stock'}</h1><p>{activeView === 'orders' ? 'Move customer orders through the fulfillment pipeline.' : 'Monitor stock health and keep the catalog ready to ship.'}</p></div><button className="staff-refresh" onClick={loadOperations}>↻ Refresh</button></header>{feedback && <div className={`staff-toast staff-toast-${feedback.type}`} role="status">{feedback.text}</div>}
      <div className="staff-kpi-grid"><article className="staff-kpi"><span>Awaiting fulfillment</span><strong>{loading ? '—' : awaitingFulfillment}</strong><small>Pending or processing</small></article><article className="staff-kpi"><span>Shipped / in transit</span><strong>{loading ? '—' : inTransit}</strong><small>Active delivery queue</small></article><article className="staff-kpi staff-kpi-warning"><span>Low stock warnings</span><strong>{loading ? '—' : lowStockProducts.length}</strong><small>At or below 5 units</small></article></div>
      {activeView === 'orders' ? <section className="staff-panel"><div className="staff-panel-heading"><div><p className="staff-eyebrow">Fulfillment queue</p><h2>Customer orders</h2></div><div className="status-filters" role="group" aria-label="Filter orders by status">{statuses.map((status) => <button key={status} className={filter === status ? 'status-filter active' : 'status-filter'} onClick={() => setFilter(status)}>{status}</button>)}</div></div>{visibleOrders.length ? <div className="staff-table-wrap"><table className="staff-table"><thead><tr><th>Reference</th><th>Customer</th><th>Items</th><th>Placed</th><th>Status</th><th>Update</th></tr></thead><tbody>{visibleOrders.map((order) => <OrderRow key={order._id} order={order} expanded={expandedOrder === order._id} onExpand={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)} onStatusChange={updateStatus} busy={busyAction === `order-${order._id}`} transitions={availableTransitions(order.status)} />)}</tbody></table></div> : <EmptyState>{loading ? 'Loading orders...' : 'No orders match this status filter.'}</EmptyState>}</section> : <section className="staff-panel"><div className="staff-panel-heading"><div><p className="staff-eyebrow">Catalog operations</p><h2>Inventory health</h2></div><button className="staff-primary-button" onClick={() => { setProductForm(emptyProduct); setModal({ type: 'product' }); }}>＋ Add new product</button></div>{products.length ? <div className="staff-table-wrap"><table className="staff-table inventory-table"><thead><tr><th>Product</th><th>Category</th><th>Current stock</th><th>Price</th><th>Action</th></tr></thead><tbody>{products.map((product) => <tr key={product._id}><td><div className="staff-product-cell">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span className="staff-product-placeholder">□</span>}<strong>{product.title}</strong></div></td><td>{product.category}</td><td>{product.stock <= 5 ? <span className="low-stock-tag">⚠ Low stock · {product.stock}</span> : <span className="healthy-stock">{product.stock} units</span>}</td><td>{formatCurrency(product.price)}</td><td><button className="staff-table-action" onClick={() => { setRestockAmount(''); setModal({ type: 'restock', product }); }}>＋ Restock</button></td></tr>)}</tbody></table></div> : <EmptyState>{loading ? 'Loading inventory...' : 'No products found.'}</EmptyState>}</section>}</section>{modal?.type === 'restock' && <div className="staff-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}><section className="staff-modal" role="dialog" aria-modal="true" aria-labelledby="restock-title"><div className="staff-modal-heading"><div><p className="staff-eyebrow">Inventory adjustment</p><h2 id="restock-title">Add inbound stock</h2></div><button className="staff-modal-close" onClick={() => setModal(null)} aria-label="Close restock form">×</button></div><p className="modal-product-name">{modal.product.title}<span>Current stock: {modal.product.stock}</span></p><form className="staff-modal-form" onSubmit={restockProduct}><label htmlFor="restock-amount">Units received</label><input id="restock-amount" type="number" min="1" step="1" required autoFocus value={restockAmount} onChange={(event) => setRestockAmount(event.target.value)} /><button className="staff-primary-button" disabled={busyAction === 'restock'}>{busyAction === 'restock' ? 'Updating...' : 'Confirm restock'}</button></form></section></div>}{modal?.type === 'product' && <div className="staff-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}><section className="staff-modal" role="dialog" aria-modal="true" aria-labelledby="new-product-title"><div className="staff-modal-heading"><div><p className="staff-eyebrow">Catalog expansion</p><h2 id="new-product-title">Add new product</h2></div><button className="staff-modal-close" onClick={() => setModal(null)} aria-label="Close product form">×</button></div><form className="staff-modal-form" onSubmit={addProduct}><label htmlFor="new-product-title-field">Product title</label><input id="new-product-title-field" required value={productForm.title} onChange={(event) => setProductForm({ ...productForm, title: event.target.value })} /><div className="staff-form-two-column"><div><label htmlFor="new-product-category">Category</label><input id="new-product-category" required value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} /></div><div><label htmlFor="new-product-price">Price (LKR)</label><input id="new-product-price" type="number" min="0" step="0.01" required value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} /></div></div><div className="staff-form-two-column"><div><label htmlFor="new-product-stock">Opening stock</label><input id="new-product-stock" type="number" min="0" required value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} /></div><div><label htmlFor="new-product-image">Image URL</label><input id="new-product-image" type="url" value={productForm.imageUrl} onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })} /></div></div><button className="staff-primary-button" disabled={busyAction === 'product'}>{busyAction === 'product' ? 'Adding...' : 'Add product'}</button></form></section></div>}</main>;
}

function OrderRow({ order, expanded, onExpand, onStatusChange, busy, transitions }) {
  const shipping = order.shippingDetails;
  return <><tr className={expanded ? 'order-row expanded' : 'order-row'}><td><button className="order-reference" onClick={onExpand} aria-expanded={expanded}>#{order._id.slice(-7).toUpperCase()} <span>{expanded ? '⌃' : '⌄'}</span></button><small>{formatDate(order.createdAt)}</small></td><td><strong>{order.user?.name || 'Unknown customer'}</strong><small>{order.user?.email || 'No email available'}</small></td><td>{order.items?.reduce((total, item) => total + item.quantity, 0) || 0} units</td><td>{formatDate(order.createdAt)}</td><td><StatusPill status={order.status} /></td><td><select className="staff-status-select" value={order.status} disabled={busy} onChange={(event) => onStatusChange(order._id, event.target.value)}>{transitions.map((status) => <option key={status}>{status}</option>)}</select></td></tr>{expanded && <tr className="order-detail-row"><td colSpan="6"><div className="order-detail-grid"><div><span className="detail-label">Shipping details</span><strong>{shipping?.fullName || order.user?.name || 'Unknown customer'}</strong>{shipping?.address ? <><span>{shipping.address}</span><span>{[shipping.city, shipping.postalCode].filter(Boolean).join(', ')}</span><span>{shipping.phone || order.user?.email}</span></> : <span className="shipping-note">Shipping address is not available on this order.</span>}</div><div><span className="detail-label">Ordered items</span>{order.items?.map((item) => <div className="ordered-item" key={item.product?._id || item._id}><span>{item.product?.title || 'Product unavailable'}</span><strong>× {item.quantity}</strong></div>)}</div><div><span className="detail-label">Order total</span><strong className="detail-total">{formatCurrency(order.total)}</strong></div></div></td></tr>}</>;
}