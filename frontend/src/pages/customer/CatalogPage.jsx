import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './CatalogPage.css';

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { cart, addToCart, updateCartQty, clearCart, itemCount, subtotal } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      setFeedback({ type: 'error', text: 'Authentication required. Please sign in to checkout.' });
      return;
    }
    if (cart.length === 0) return;

    try {
      const payload = {
        items: cart.map(item => ({ productId: item._id, quantity: item.quantity })),
        couponCode: couponCode.trim() || undefined
      };

      const res = await api.post('/orders/checkout', payload);

      setFeedback({
        type: 'success',
        text: `Order confirmed! Reference: #${res.data.order._id.slice(-6)} · Settled: Rs. ${res.data.order.total.toLocaleString()}`
      });
      clearCart();
      setCouponCode('');
      fetchProducts();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || err.response?.data?.message || 'Checkout could not be processed.' });
    }
  };

  return (
    <main className="catalog-container">
      {/* Header */}
      <div className="catalog-header">
        <h1 className="catalog-title">Storefront Catalog</h1>
        <p className="catalog-subtitle">
          Explore modern hardware, apparel, and limited seasonal promotions.
        </p>
      </div>

      {/* Global Alert */}
      {feedback && (
        <div className={`alert-box ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          <span>{feedback.text}</span>
          <button className="alert-close-btn" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {/* Grid Wrapper */}
      <div className="catalog-grid-wrapper">
        {/* Products Section */}
        <div>
          {loading ? (
            <p className="catalog-loading" role="status">Fetching catalog entries...</p>
          ) : (
            <div className="products-grid">
              {products.map(p => (
                <div key={p._id} className="product-card">
                  <div className="product-image-box">
                    <img src={p.imageUrl} alt={p.title} className="product-image" />
                  </div>

                  <div className="product-body">
                    <span className="product-category">{p.category}</span>
                    <h3 className="product-card-title">{p.title}</h3>

                    <div className="product-footer">
                      <div className="product-meta-row">
                        <span className="product-price">Rs. {p.price.toLocaleString()}</span>
                        <span className={`stock-status ${p.stock > 0 ? 'stock-in' : 'stock-out'}`}>
                          {p.stock > 0 ? `${p.stock} in stock` : 'Depleted'}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          const existing = cart.find((item) => item._id === p._id);
                          if (existing?.quantity >= p.stock) {
                            setFeedback({ type: 'error', text: `Only ${p.stock} units available in inventory.` });
                            return;
                          }
                          addToCart(p);
                          setFeedback({ type: 'success', text: `${p.title} added to your bag.` });
                        }}
                        disabled={p.stock === 0}
                        className={`btn-add-cart ${p.stock > 0 ? 'available' : 'depleted'}`}
                      >
                        {p.stock > 0 ? 'Add to cart' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Cart */}
        <aside className="cart-sidebar">
          <div className="cart-header">
            <h2 className="cart-title">Order Summary</h2>
            <span className="cart-badge">{itemCount} items</span>
          </div>

          {cart.length === 0 ? (
            <div className="empty-cart-box">
              <div className="empty-cart-icon">🛒</div>
              <p className="empty-cart-text">Your shopping bag is empty.</p>
            </div>
          ) : (
            <div>
              <div className="cart-items-list">
                {cart.map(item => (
                  <div key={item._id} className="cart-item-row">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.title}</div>
                      <div className="cart-item-price">Rs. {item.price.toLocaleString()} each</div>
                    </div>

                    <div className="qty-control-group">
                      <button className="btn-qty" aria-label={`Decrease ${item.title} quantity`} onClick={() => updateCartQty(item._id, -1)}>-</button>
                      <span className="qty-count">{item.quantity}</span>
                      <button className="btn-qty" aria-label={`Increase ${item.title} quantity`} onClick={() => updateCartQty(item._id, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="coupon-section">
                <label className="coupon-label">Have a voucher code?</label>
                <input
                  type="text"
                  placeholder="e.g. SAVE10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="coupon-input"
                />
              </div>

              {/* Totals */}
              <div className="totals-section">
                <div className="subtotal-row">
                  <span>Subtotal</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="total-row">
                  <span>Estimated Total</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
              </div>

              <button className="btn-checkout" onClick={handleCheckout}>
                Proceed to Checkout
              </button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}