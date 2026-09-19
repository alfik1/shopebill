import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/add-product', label: 'Add Product', icon: '➕' },
  { to: '/billing', label: 'Billing', icon: '🧾' },
  { to: '/employees', label: 'Employees', icon: '👥' },
  { to: '/history', label: 'History', icon: '🕒' },
  { to: '/collection', label: 'Collection', icon: '🗂️' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function Sidebar({ open = false, onClose = () => {} }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  return (
    <div className={`sidebar${open ? ' open' : ''}`}>
      <button
        type="button"
        className="sidebar-close"
        onClick={onClose}
        aria-label="Close menu"
      >
        ✕
      </button>
      <div>
        <div className="sidebar-logo">Shop<span>Bill</span></div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onClose}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="sidebar-footer">
        <button className="nav-item" onClick={handleLogout} style={{ width: '100%' }}>
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}