import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

import AuthPage from './pages/AuthPage';
import CatalogPage from './pages/customer/CatalogPage';
import StaffOrdersPage from './pages/staff/StaffOrdersPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AcceptInvitePage from './pages/AcceptInvitePage';
import './App.css'; 

const Unauthorized = () => (
  <div className="unauthorized-wrapper">
    <h2 className="unauthorized-code">403 - Forbidden</h2>
    <p className="unauthorized-desc">You lack privileges to access this sector.</p>
  </div>
);

const Navbar = () => {
  const { user, logout } = useAuth();

  const getRoleClass = (role) => {
    if (role === 'admin') return 'role-admin';
    if (role === 'staff') return 'role-staff';
    return 'role-customer';
  };

  return (
    <header className="app-header">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo">
          <span className="brand-icon-box">⚡</span>
          MyShop
        </Link>

        {/* Dynamic Role Navigation */}
        <nav className="nav-links-group">
          {(user?.role === 'staff' || user?.role === 'admin') && (
            <NavLink
              to="/staff"
              className={({ isActive }) => `nav-link-item nav-link-staff ${isActive ? 'active' : ''}`}
            >
              Staff Portal
            </NavLink>
          )}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link-item nav-link-admin ${isActive ? 'active' : ''}`}
            >
              Admin Dashboard
            </NavLink>
          )}
        </nav>

        {/* User Session Meta */}
        <div className="navbar-actions">
          {user ? (
            <div className="user-profile-meta">
              <div className="user-info-text">
                <div className="user-display-name">{user.name}</div>
                <div className={`user-role-badge ${getRoleClass(user.role)}`}>
                  {user.role}
                </div>
              </div>
              <button onClick={logout} className="btn-signout">
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-signin">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<ProtectedRoute allowedRoles={['staff', 'admin']} />}>
            <Route path="/staff" element={<StaffOrdersPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}