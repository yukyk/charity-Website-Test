import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Heart, Menu, X, Bell, ChevronDown,
  LayoutDashboard, Building2, ShieldCheck, LogOut,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { getUnreadCount } from '../../api/user';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

export default function Navbar() {
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const dropdownRef = useRef(null);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isHome    = location.pathname === '/';

  /* scroll detection */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* close everything on route change */
  useEffect(() => { setMenuOpen(false); setDropdownOpen(false); }, [location.pathname]);

  /* lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  /* unread notification count */
  const { data: unreadData } = useQuery({
    queryKey: ['nav-unread'],
    queryFn:  getUnreadCount,
    enabled:  isAuthenticated,
    refetchInterval: 60000,
    staleTime:       30000,
  });
  const unreadCount = unreadData?.count ?? unreadData?.data?.count ?? 0;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  /* transparent only on homepage while not scrolled */
  const transparent = isHome && !scrolled;

  const navLinks = [
    { to: '/',          label: 'Home',       end: true },
    { to: '/charities', label: 'Charities' },
    { to: '/about',     label: 'About' },
    { to: '/contact',   label: 'Contact' },
  ];

  const dashboardItems = user?.role === 'admin'
    ? [{ to: '/admin',              label: 'Admin Panel',         Icon: ShieldCheck }]
    : [
        { to: '/dashboard',          label: 'My Dashboard',        Icon: LayoutDashboard },
        { to: '/charity-dashboard',  label: 'Charity Dashboard',   Icon: Building2 },
      ];

  const notifPath = user?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <header
      className="navbar"
      style={{
        background:          transparent ? 'transparent' : '#fff',
        borderBottomColor:   transparent ? 'transparent' : 'var(--color-border)',
        boxShadow:           scrolled    ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
        transition:          'background 0.3s, border-color 0.3s, box-shadow 0.3s',
      }}
    >
      <div className="container">
        <div className="navbar-inner">

          {/* ── Brand ───────────────────────────────────────────────── */}
          <Link to="/" className="navbar-logo">
            <span className="navbar-logo-icon"
              style={{ background: transparent ? 'rgba(255,255,255,0.22)' : 'var(--color-primary)' }}>
              <Heart size={18} fill="white" />
            </span>
            <span className="navbar-logo-text"
              style={{ color: transparent ? '#fff' : 'var(--color-primary)' }}>
              GiveHope
            </span>
          </Link>

          {/* ── Desktop nav links ─────────────────────────────────── */}
          <nav className="navbar-links" aria-label="Main navigation">
            {navLinks.map(({ to, label, end }) => (
              <NavLink
                key={to} to={to} end={end}
                className={({ isActive }) =>
                  ['nav-link', isActive && !transparent ? 'active' : ''].filter(Boolean).join(' ')
                }
                style={({ isActive }) => ({
                  color: transparent
                    ? (isActive ? '#fff' : 'rgba(255,255,255,0.82)')
                    : (isActive ? 'var(--color-primary)' : 'var(--color-text)'),
                  background: transparent && isActive ? 'rgba(255,255,255,0.14)' : undefined,
                })}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* ── Desktop auth controls ─────────────────────────────── */}
          <div className="navbar-auth">
            {isAuthenticated ? (
              <>
                {/* Notification bell */}
                <Link
                  to={notifPath}
                  title="Notifications"
                  style={{
                    position: 'relative', display: 'flex', alignItems: 'center',
                    padding: 8, borderRadius: 8,
                    color: transparent ? 'rgba(255,255,255,0.85)' : 'var(--color-text-muted)',
                    transition: 'color 0.15s',
                  }}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: 4, right: 4,
                      minWidth: 16, height: 16, borderRadius: 8,
                      background: 'var(--color-accent)', color: '#1A1A2E',
                      fontSize: 10, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 3px',
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Avatar dropdown */}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '4px 6px', borderRadius: 8,
                    }}
                  >
                    <Avatar name={user?.name} size="sm" />
                    <span style={{
                      fontWeight: 500, fontSize: 14,
                      color: transparent ? '#fff' : 'var(--color-text)',
                    }}>
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown
                      size={14}
                      color={transparent ? '#fff' : 'var(--color-text-muted)'}
                      style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}
                    />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0,  scale: 1    }}
                        exit={   { opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                          background: '#fff', borderRadius: 14, padding: '8px 0',
                          boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
                          border: '1px solid var(--color-border)',
                          minWidth: 210, zIndex: 200,
                        }}
                      >
                        <div style={{
                          padding: '10px 16px 12px',
                          borderBottom: '1px solid var(--color-border)',
                          marginBottom: 4,
                        }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>{user?.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{user?.email}</div>
                        </div>

                        {dashboardItems.map(({ to, label, Icon }) => (
                          <Link
                            key={to} to={to}
                            onClick={() => setDropdownOpen(false)}
                            className="dd-item"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 16px', color: 'var(--color-text)',
                              fontSize: 14,
                            }}
                          >
                            <Icon size={15} color="var(--color-primary)" />
                            {label}
                          </Link>
                        ))}

                        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 4, paddingTop: 4 }}>
                          <button
                            onClick={handleLogout}
                            className="dd-item dd-item-danger"
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 16px', color: 'var(--color-error)',
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 14, textAlign: 'left',
                            }}
                          >
                            <LogOut size={15} />
                            Log out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  style={transparent ? { color: 'rgba(255,255,255,0.9)' } : {}}
                >
                  Log in
                </Button>
                <Button
                  variant={transparent ? 'accent' : 'primary'}
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  Register
                </Button>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ─────────────────────────────────── */}
          <button
            className="navbar-toggle"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            style={{ color: transparent ? '#fff' : 'var(--color-text)' }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Mobile full-screen overlay ────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={   { x: '100%' }}
            transition={{ type: 'tween', duration: 0.26 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 998,
              background: '#fff', overflowY: 'auto',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* header row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 20px', height: 64, borderBottom: '1px solid var(--color-border)',
            }}>
              <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
                <span className="navbar-logo-icon"><Heart size={18} fill="white" /></span>
                <span className="navbar-logo-text">GiveHope</span>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8 }}
              >
                <X size={24} color="var(--color-text)" />
              </button>
            </div>

            {/* body */}
            <div style={{ padding: '20px 24px 40px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 28 }}>
                {navLinks.map(({ to, label, end }) => (
                  <NavLink
                    key={to} to={to} end={end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      ['mobile-nav-link', isActive ? 'active' : ''].filter(Boolean).join(' ')
                    }
                    style={{ fontSize: 19, padding: '13px 8px', fontWeight: 500 }}
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 24 }}>
                {isAuthenticated ? (
                  <>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '0 8px 16px',
                    }}>
                      <Avatar name={user?.name} size="md" />
                      <div>
                        <div style={{ fontWeight: 600 }}>{user?.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{user?.email}</div>
                      </div>
                    </div>

                    {dashboardItems.map(({ to, label, Icon }) => (
                      <Link
                        key={to} to={to}
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '13px 8px', color: 'var(--color-text)', fontSize: 15,
                          borderBottom: '1px solid rgba(0,0,0,0.04)',
                        }}
                      >
                        <Icon size={18} color="var(--color-primary)" />
                        {label}
                      </Link>
                    ))}

                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%', marginTop: 16, padding: '14px',
                        background: '#FEF2F2', color: 'var(--color-error)',
                        border: 'none', borderRadius: 10, fontWeight: 600,
                        fontSize: 15, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      <LogOut size={18} />
                      Log out
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Button variant="secondary" fullWidth onClick={() => { navigate('/login');    setMenuOpen(false); }}>Log in</Button>
                    <Button variant="primary"   fullWidth onClick={() => { navigate('/register'); setMenuOpen(false); }}>Create Account</Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
