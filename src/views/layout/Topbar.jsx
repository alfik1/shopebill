import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const titles = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/employees': 'Employees',
  '/history': 'History',
  '/collection': 'Collection',
  '/profile': 'Profile',
};

export default function Topbar({ menuOpen = false, onMenuClick = () => {} }) {
  const location = useLocation();
  const { user } = useAuth();
  const title = titles[location.pathname] || 'ShopBill';
  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'AD';

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="menu-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          ☰
        </button>
        <div className="topbar-title">{title}</div>
      </div>
      <div className="topbar-right">
        <div className="search-box">
          <span>🔍</span>
          <input placeholder="Search..." />
        </div>
        <div className="user-mini">
          <div className="avatar">{initials}</div>
          <div>
            <div className="name">{user?.name}</div>
            <div className="role">{user?.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}