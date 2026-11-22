import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const GUEST_CART_KEY = 'cart:guest';

const getUserCartKey = (user) => `cart:user:${user?.id || user?.email || 'unknown'}`;

const readCart = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    if (user) {
      const guestCart = readCart(GUEST_CART_KEY);
      const userKey = getUserCartKey(user);
      const storedCart = readCart(userKey);
      const merged = [...storedCart];
      guestCart.forEach((guestItem) => {
        const existing = merged.find((item) => item._id === guestItem._id);
        if (existing) existing.quantity += guestItem.quantity;
        else merged.push(guestItem);
      });
      setCart(merged);
      localStorage.setItem(userKey, JSON.stringify(merged));
      localStorage.removeItem(GUEST_CART_KEY);
    } else {
      setCart(readCart(GUEST_CART_KEY));
    }
  }, [user]);

  useEffect(() => {
    const key = user ? getUserCartKey(user) : GUEST_CART_KEY;
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart, user]);

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) return current;
        return current.map((item) => item._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item);
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const updateCartQty = (productId, delta) => {
    setCart((current) => current.map((item) => {
      if (item._id !== productId) return item;
      const quantity = item.quantity + delta;
      return quantity > 0 ? { ...item, quantity: Math.min(quantity, item.stock) } : null;
    }).filter(Boolean));
  };

  const clearCart = () => setCart([]);
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const value = { cart, addToCart, updateCartQty, clearCart, itemCount, subtotal };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);