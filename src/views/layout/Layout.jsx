import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  // Stop the page behind the drawer from scrolling
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Escape closes the drawer
  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  // Close the drawer when the screen grows to desktop size
  useEffect(() => {
    const media = window.matchMedia('(min-width: 769px)');

    const onChange = (e) => {
      if (e.matches) {
        setMenuOpen(false);
      }
    };

    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={closeMenu} />
      <div
        className={`sidebar-overlay${menuOpen ? ' open' : ''}`}
        onClick={closeMenu}
      />
      <div className="main-area">
        <Topbar menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)} />
        <div className="page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}