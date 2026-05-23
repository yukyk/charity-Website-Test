import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const platform = [
  ['/', 'Home'],
  ['/charities', 'Browse Charities'],
  ['/about', 'About Us'],
  ['/contact', 'Contact'],
];

const account = [
  ['/register', 'Register'],
  ['/login', 'Log In'],
  ['/dashboard', 'My Dashboard'],
  ['/charity-dashboard', 'Charity Admin'],
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand blurb */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 6, display: 'flex' }}>
                <Heart size={18} fill="white" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 20 }}>GiveHope</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.8, maxWidth: 280 }}>
              Your Kindness Can Change a Life Today. We connect donors with
              verified charities making real, measurable impact.
            </p>
          </div>

          {/* Platform links */}
          <div>
            <p className="footer-heading">Platform</p>
            {platform.map(([to, label]) => (
              <Link key={to} to={to} className="footer-link">{label}</Link>
            ))}
          </div>

          {/* Account links */}
          <div>
            <p className="footer-heading">Account</p>
            {account.map(([to, label]) => (
              <Link key={to} to={to} className="footer-link">{label}</Link>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {year} GiveHope. All rights reserved.</p>
          <p>Made with ❤️ for a better world</p>
        </div>
      </div>
    </footer>
  );
}
