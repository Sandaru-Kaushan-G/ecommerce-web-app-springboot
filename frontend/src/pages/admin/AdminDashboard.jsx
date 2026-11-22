import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import './AdminDashboard.css';

const tabs = [
  { id: 'overview', label: 'Overview', icon: '▦' },
  { id: 'products', label: 'Products & Inventory', icon: '□' },
  { id: 'orders', label: 'Orders & Fulfillment', icon: '≡' },
  { id: 'staff', label: 'Staff & Access', icon: '♙' },
  { id: 'coupons', label: 'Coupons & Promotions', icon: '◇' }
];

const emptyProduct = { title: '', category: '', price: '', stock: '', imageUrl: '' };
const emptyCoupon = { code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderValue: '0', validUntil: '' };

const getProblemMessage = (error, fallback) => error.response?.data?.detail || error.response?.data?.message || fallback;
const formatCurrency = (value) => `LKR ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-LK', { dateStyle: 'medium' }) : '—';

function StatusPill({ status }) {
  return <span className={`status-pill status-${status.toLowerCase()}`}>{status}</span>;
}

function EmptyState({ children }) {
  return <div className="admin-empty-state">{children}</div>;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [inviteLinks, setInviteLinks] = useState({});
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [orderFilter, setOrderFilter] = useState('All');
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'staff' });
  const [couponForm, setCouponForm] = useState(emptyCoupon);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [busyAction, setBusyAction] = useState('');

  const notify = (type, text) => {
    setFeedback({ type, text });
    window.setTimeout(() => setFeedback(null), 4200);
  };

  const loadData = async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      api.get('/admin/metrics'),
      api.get('/products'),
      api.get('/orders'),
      api.get('/admin/users'),
      api.get('/invites'),
      api.get('/coupons')
    ]);
    const [metricsResult, productsResult, ordersResult, usersResult, invitesResult, couponsResult] = results;
    if (metricsResult.status === 'fulfilled') setMetrics(metricsResult.value.data);
    if (productsResult.status === 'fulfilled') setProducts(productsResult.value.data);
    if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value.data);
    if (usersResult.status === 'fulfilled') setUsers(usersResult.value.data);
    if (invitesResult.status === 'fulfilled') setInvites(invitesResult.value.data);
    if (couponsResult.status === 'fulfilled') setCoupons(couponsResult.value.data);
    if (results.some((result) => result.status === 'rejected')) notify('error', 'Some management data could not be loaded.');
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const activeStaff = useMemo(() => users.filter((user) => ['staff', 'admin'].includes(user.role) && user.isActive), [users]);
  const filteredOrders = useMemo(() => orderFilter === 'All' ? orders : orders.filter((order) => order.status === orderFilter), [orders, orderFilter]);

  const openAddProduct = () => { setEditingProduct(null); setProductForm(emptyProduct); setProductModalOpen(true); };
  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({ title: product.title, category: product.category, price: product.price, stock: product.stock, imageUrl: product.imageUrl || '' });
    setProductModalOpen(true);
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setBusyAction('product');
    try {
      const payload = { ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) };
      const response = editingProduct ? await api.patch(`/products/${editingProduct._id}`, payload) : await api.post('/products', payload);
      setProducts((current) => editingProduct ? current.map((product) => product._id === editingProduct._id ? response.data : product) : [response.data, ...current]);
      setProductModalOpen(false);
      notify('success', editingProduct ? 'Product updated.' : 'Product added to inventory.');
    } catch (error) { notify('error', getProblemMessage(error, 'Product could not be saved.')); }
    finally { setBusyAction(''); }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.title} from the catalog?`)) return;
    try { await api.delete(`/products/${product._id}`); setProducts((current) => current.filter((item) => item._id !== product._id)); notify('success', 'Product deleted.'); }
    catch (error) { notify('error', getProblemMessage(error, 'Product could not be deleted.')); }
  };

  const updateOrderStatus = async (orderId, status) => {
    setBusyAction(`order-${orderId}`);
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status });
      setOrders((current) => current.map((order) => order._id === orderId ? response.data.updated : order));
      notify('success', 'Order status updated.');
    } catch (error) { notify('error', getProblemMessage(error, 'Order status could not be updated.')); }
    finally { setBusyAction(''); }
  };

  const submitInvite = async (event) => {
    event.preventDefault(); setBusyAction('invite');
    try {
      const response = await api.post('/invites', inviteForm);
      setInvites((current) => [response.data.invite, ...current]);
      setInviteLinks((current) => ({ ...current, [response.data.invite.id]: response.data.inviteLink }));
      setInviteForm({ email: '', role: 'staff' });
      notify('success', 'Invitation generated and sent.');
    } catch (error) { notify('error', getProblemMessage(error, 'Invitation could not be generated.')); }
    finally { setBusyAction(''); }
  };

  const updateUser = async (user, payload) => {
    try {
      const response = await api.patch(`/admin/users/${user._id}/role`, payload);
      setUsers((current) => current.map((item) => item._id === user._id ? response.data : item));
      notify('success', 'User access updated.');
    } catch (error) { notify('error', getProblemMessage(error, 'User access could not be updated.')); }
  };

  const copyInviteLink = async (inviteId) => {
    try { await navigator.clipboard.writeText(inviteLinks[inviteId]); notify('success', 'Invitation link copied.'); }
    catch { notify('error', 'Clipboard access was unavailable.'); }
  };

  const saveCoupon = async (event) => {
    event.preventDefault(); setBusyAction('coupon');
    try {
      const response = await api.post('/coupons', { ...couponForm, discountValue: Number(couponForm.discountValue), minOrderValue: Number(couponForm.minOrderValue) });
      setCoupons((current) => [response.data, ...current]); setCouponForm(emptyCoupon); notify('success', 'Coupon created.');
    } catch (error) { notify('error', getProblemMessage(error, 'Coupon could not be created.')); }
    finally { setBusyAction(''); }
  };

  const deleteCoupon = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    try { await api.delete(`/coupons/${coupon._id}`); setCoupons((current) => current.filter((item) => item._id !== coupon._id)); notify('success', 'Coupon deleted.'); }
    catch (error) { notify('error', getProblemMessage(error, 'Coupon could not be deleted.')); }
  };

  const renderOverview = () => (
    <>
      <div className="metric-grid">
        {[
          ['Total revenue', metrics ? formatCurrency(metrics.totalRevenue) : null, '↗  Healthy volume', 'metric-revenue'],
          ['Total orders', metrics?.totalOrders, `${metrics?.pendingOrders || 0} in progress`, 'metric-orders'],
          ['Low stock items', metrics?.lowStockCount, 'Requires attention', 'metric-warning'],
          ['Active staff', activeStaff.length, `${metrics?.totalCustomers || 0} customers`, 'metric-staff']
        ].map(([label, value, note, className]) => <article className={`metric-card ${className}`} key={label}>
          <span className="metric-label">{label}</span>{loading && !metrics ? <span className="metric-skeleton" /> : <strong>{value}</strong>}<span className="metric-note">{note}</span>
        </article>)}
      </div>
      <section className="content-panel overview-orders"><div className="panel-heading"><div><p className="eyebrow">Live activity</p><h2>Recent orders</h2></div><button className="text-button" onClick={() => setActiveTab('orders')}>View all orders →</button></div>
        {metrics?.recentOrders?.length ? <OrderTable orders={metrics.recentOrders} compact /> : <EmptyState>No recent orders to display.</EmptyState>}
      </section>
      <section className="quick-actions"><h2>Quick actions</h2><div className="quick-action-grid"><button onClick={openAddProduct}>＋ Add product</button><button onClick={() => setActiveTab('staff')}>＋ Invite staff</button><button onClick={() => setActiveTab('coupons')}>＋ Create coupon</button></div></section>
    </>
  );

  const renderProducts = () => <section className="content-panel"><div className="panel-heading"><div><p className="eyebrow">Catalog operations</p><h2>Products & inventory</h2></div><button className="primary-button" onClick={openAddProduct}>＋ Add product</button></div>
    {products.length ? <div className="data-table-wrap"><table className="data-table product-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>{products.map((product) => <tr key={product._id}><td><div className="product-cell">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span className="product-thumb-placeholder">□</span>}<strong>{product.title}</strong></div></td><td>{product.category}</td><td>{formatCurrency(product.price)}</td><td><span className={product.stock <= 5 ? 'stock-critical' : 'stock-healthy'}>{product.stock} units</span></td><td><button className="table-action" onClick={() => openEditProduct(product)}>Edit</button><button className="table-action danger" onClick={() => deleteProduct(product)}>Delete</button></td></tr>)}</tbody></table></div> : <EmptyState>No products found.</EmptyState>}
  </section>;

  const renderOrders = () => <section className="content-panel"><div className="panel-heading"><div><p className="eyebrow">Fulfillment</p><h2>Orders & fulfillment</h2></div><select className="filter-select" value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)}><option>All</option><option>Pending</option><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></div>{filteredOrders.length ? <OrderTable orders={filteredOrders} onStatusChange={updateOrderStatus} busyAction={busyAction} /> : <EmptyState>No orders match this filter.</EmptyState>}</section>;

  const renderStaff = () => <><section className="content-panel"><div className="panel-heading"><div><p className="eyebrow">Access control</p><h2>Invite staff member</h2></div></div><form className="invite-form suite-form" onSubmit={submitInvite}><div className="admin-field"><label htmlFor="invite-email">Email address</label><input id="invite-email" type="email" value={inviteForm.email} required onChange={(event) => setInviteForm({ ...inviteForm, email: event.target.value })} /></div><div className="admin-field"><label htmlFor="invite-role">Role</label><select id="invite-role" value={inviteForm.role} onChange={(event) => setInviteForm({ ...inviteForm, role: event.target.value })}><option value="staff">Staff</option><option value="admin">Admin</option></select></div><button className="primary-button" disabled={busyAction === 'invite'}>{busyAction === 'invite' ? 'Generating...' : 'Generate & Send Invitation'}</button></form></section><section className="content-panel"><div className="panel-heading"><h2>Active staff directory</h2><span className="panel-count">{activeStaff.length} active</span></div>{activeStaff.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Access</th></tr></thead><tbody>{activeStaff.map((user) => <tr key={user._id}><td><strong>{user.name}</strong></td><td>{user.email}</td><td><span className="role-badge">{user.role}</span></td><td>{formatDate(user.createdAt)}</td><td><button className="table-action danger" onClick={() => updateUser(user, { isActive: false })}>Deactivate</button></td></tr>)}</tbody></table></div> : <EmptyState>No active staff accounts.</EmptyState>}</section><section className="content-panel"><div className="panel-heading"><h2>Pending invitations</h2><span className="panel-count">{invites.length} records</span></div>{invites.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Expires</th><th>Link</th></tr></thead><tbody>{invites.map((invite) => <tr key={invite.id}><td>{invite.email}</td><td><span className="role-badge">{invite.role}</span></td><td><StatusPill status={invite.status} /></td><td>{formatDate(invite.expiresAt)}</td><td>{inviteLinks[invite.id] ? <button className="table-action" onClick={() => copyInviteLink(invite.id)}>Copy link</button> : <span className="muted-text">Only available when generated</span>}</td></tr>)}</tbody></table></div> : <EmptyState>No invitations yet.</EmptyState>}</section></>;

  const renderCoupons = () => <><section className="content-panel"><div className="panel-heading"><div><p className="eyebrow">Revenue tools</p><h2>Create promotion</h2></div></div><form className="coupon-form" onSubmit={saveCoupon}><div className="admin-field"><label htmlFor="coupon-code">Code</label><input id="coupon-code" required value={couponForm.code} placeholder="WELCOME10" onChange={(event) => setCouponForm({ ...couponForm, code: event.target.value.toUpperCase() })} /></div><div className="admin-field"><label htmlFor="coupon-type">Type</label><select id="coupon-type" value={couponForm.discountType} onChange={(event) => setCouponForm({ ...couponForm, discountType: event.target.value })}><option value="PERCENTAGE">Percentage</option><option value="FLAT">Flat LKR</option></select></div><div className="admin-field"><label htmlFor="coupon-value">Value</label><input id="coupon-value" type="number" min="1" required value={couponForm.discountValue} onChange={(event) => setCouponForm({ ...couponForm, discountValue: event.target.value })} /></div><div className="admin-field"><label htmlFor="coupon-minimum">Minimum order</label><input id="coupon-minimum" type="number" min="0" value={couponForm.minOrderValue} onChange={(event) => setCouponForm({ ...couponForm, minOrderValue: event.target.value })} /></div><div className="admin-field"><label htmlFor="coupon-expiry">Valid until</label><input id="coupon-expiry" type="datetime-local" required value={couponForm.validUntil} onChange={(event) => setCouponForm({ ...couponForm, validUntil: event.target.value })} /></div><button className="primary-button" disabled={busyAction === 'coupon'}>{busyAction === 'coupon' ? 'Creating...' : 'Create coupon'}</button></form></section><section className="content-panel"><div className="panel-heading"><h2>Active promotions</h2><span className="panel-count">{coupons.length} codes</span></div>{coupons.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Code</th><th>Discount</th><th>Minimum order</th><th>Valid until</th><th>Action</th></tr></thead><tbody>{coupons.map((coupon) => <tr key={coupon._id}><td><strong className="coupon-code">{coupon.code}</strong></td><td>{coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue)}</td><td>{formatCurrency(coupon.minOrderValue)}</td><td><StatusPill status={new Date(coupon.validUntil) > new Date() ? 'Active' : 'Expired'} /><span className="date-after-pill">{formatDate(coupon.validUntil)}</span></td><td><button className="table-action danger" onClick={() => deleteCoupon(coupon)}>Delete</button></td></tr>)}</tbody></table></div> : <EmptyState>No promotional codes created.</EmptyState>}</section></>;

  return <div className="admin-shell"><aside className="admin-sidebar"><div className="sidebar-brand"><span className="sidebar-brand-mark">⚡</span><div><strong>MyShop</strong><span>Control center</span></div></div><nav className="sidebar-nav" aria-label="Admin sections">{tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? 'sidebar-tab active' : 'sidebar-tab'} onClick={() => setActiveTab(tab.id)}><span>{tab.icon}</span>{tab.label}</button>)}</nav><div className="sidebar-footer"><span className="online-dot" /> Systems operational</div></aside><main className="admin-main"><header className="suite-header"><div><p className="eyebrow">Management portal</p><h1>{tabs.find((tab) => tab.id === activeTab)?.label}</h1></div><button className="refresh-button" onClick={loadData} aria-label="Refresh management data">↻ Refresh</button></header>{feedback && <div className={`suite-toast suite-toast-${feedback.type}`} role="status">{feedback.text}</div>}{activeTab === 'overview' && renderOverview()}{activeTab === 'products' && renderProducts()}{activeTab === 'orders' && renderOrders()}{activeTab === 'staff' && renderStaff()}{activeTab === 'coupons' && renderCoupons()}</main>{isProductModalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setProductModalOpen(false)}><section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title"><div className="modal-heading"><div><p className="eyebrow">Catalog</p><h2 id="product-modal-title">{editingProduct ? 'Edit product' : 'Add product'}</h2></div><button className="modal-close" onClick={() => setProductModalOpen(false)} aria-label="Close product form">×</button></div><form className="modal-form" onSubmit={saveProduct}><div className="admin-field"><label htmlFor="product-title">Title</label><input id="product-title" required value={productForm.title} onChange={(event) => setProductForm({ ...productForm, title: event.target.value })} /></div><div className="form-two-column"><div className="admin-field"><label htmlFor="product-category">Category</label><input id="product-category" required value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} /></div><div className="admin-field"><label htmlFor="product-price">Price (LKR)</label><input id="product-price" type="number" min="0" step="0.01" required value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} /></div></div><div className="form-two-column"><div className="admin-field"><label htmlFor="product-stock">Stock</label><input id="product-stock" type="number" min="0" required value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} /></div><div className="admin-field"><label htmlFor="product-image">Image URL</label><input id="product-image" type="url" value={productForm.imageUrl} onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })} /></div></div><button className="primary-button modal-submit" disabled={busyAction === 'product'}>{busyAction === 'product' ? 'Saving...' : editingProduct ? 'Save changes' : 'Add product'}</button></form></section></div>}</div>;
}

function OrderTable({ orders, compact = false, onStatusChange, busyAction }) {
  return <div className="data-table-wrap"><table className="data-table order-table"><thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th>{!compact && <th>Update</th>}</tr></thead><tbody>{orders.map((order) => <tr key={order._id}><td><strong>#{order._id.slice(-7).toUpperCase()}</strong><span className="table-subtext">{formatDate(order.createdAt)}</span></td><td>{order.user?.name || 'Unknown customer'}</td><td>{formatCurrency(order.total)}</td><td><StatusPill status={order.status} /></td>{!compact && <td><select className="status-select" value={order.status} disabled={busyAction === `order-${order._id}`} onChange={(event) => onStatusChange(order._id, event.target.value)}><option>Pending</option><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></td>}</tr>)}</tbody></table></div>;
}