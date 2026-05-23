import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Menu, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const close = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    close();
  };

  const dashboardPath = user?.role === 'admin' ? '/admin' : '/dashboard';

  const navLinks = [
    { to: '/',         label: 'Home',      end: true },
    { to: '/charities', label: 'Charities' },
    { to: '/about',    label: 'About' },
    { to: '/contact',  label: 'Contact' },
  ];

  const linkClass = ({ isActive }) =>
    ['nav-link', isActive ? 'active' : ''].filter(Boolean).join(' ');

  const mobileLinkClass = ({ isActive }) =>
    ['mobile-nav-link', isActive ? 'active' : ''].filter(Boolean).join(' ');

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-inner">
          {/* Brand */}
          <Link to="/" className="navbar-logo" onClick={close}>
            <span className="navbar-logo-icon">
              <Heart size={18} fill="white" />
            </span>
            <span className="navbar-logo-text">GiveHope</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="navbar-links" aria-label="Main navigation">
            {navLinks.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop auth controls */}
          <div className="navbar-auth">
            {isAuthenticated ? (
              <>
                <Link
                  to={dashboardPath}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
                >
                  <Avatar name={user?.name} size="sm" />
                  <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--color-text)' }}>
                    {user?.name?.split(' ')[0]}
                  </span>
                </Link>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Log in
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                  Register
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="navbar-toggle"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            <div className="container">
              <div className="mobile-menu-inner">
                {navLinks.map(({ to, label, end }) => (
                  <NavLink key={to} to={to} end={end} className={mobileLinkClass} onClick={close}>
                    {label}
                  </NavLink>
                ))}

                <div className="mobile-menu-divider">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to={dashboardPath}
                        onClick={close}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px' }}
                      >
                        <Avatar name={user?.name} size="sm" />
                        <span style={{ fontWeight: 500 }}>{user?.name}</span>
                      </Link>
                      <Button
                        variant="secondary"
                        fullWidth
                        style={{ marginTop: 8 }}
                        onClick={handleLogout}
                      >
                        Log out
                      </Button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => { navigate('/login'); close(); }}
                      >
                        Log in
                      </Button>
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={() => { navigate('/register'); close(); }}
                      >
                        Register
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
