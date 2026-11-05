import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const title = titles[location.pathname] || 'ShopBill';
  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'AD';

  // ========================================================
  // SEARCH (updates /products?search=... and Products.jsx calls the API)
  // ========================================================

  const urlSearch = searchParams.get('search') || '';

  const [searchText, setSearchText] = useState(urlSearch);

  const lastSent = useRef(urlSearch);

  // Keep the box in sync with the URL (for example, clears when you leave Products)
  useEffect(() => {
    setSearchText(urlSearch);
    lastSent.current = urlSearch;
  }, [urlSearch]);

  const runSearch = (value) => {

    const text = value.trim();

    if (text === lastSent.current) return;

    console.log('[Topbar] Searching:', text);

    lastSent.current = text;

    if (text) {
      navigate(`/products?search=${encodeURIComponent(text)}`, {
        replace: location.pathname === '/products',
      });
    } else if (location.pathname === '/products') {
      navigate('/products', { replace: true });
    }
  };

  // Wait 400ms after the user stops typing, then search
  useEffect(() => {

    const timer = setTimeout(() => runSearch(searchText), 400);

    return () => clearTimeout(timer);

  }, [searchText]);

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
          <input
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSearch(searchText);
            }}
          />
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