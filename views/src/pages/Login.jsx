import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Heart, ArrowRight } from 'lucide-react';
import { login as loginAPI } from '../api/auth';
import { getMyCharity } from '../api/charity';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
};

const DONATION_QUOTES = [
  { text: '"The meaning of life is to find your gift. The purpose of life is to give it away."', author: 'Pablo Picasso' },
  { text: '"We make a living by what we get. We make a life by what we give."', author: 'Winston Churchill' },
  { text: '"No one has ever become poor by giving."', author: 'Anne Frank' },
];

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const quote = DONATION_QUOTES[Math.floor(Math.random() * DONATION_QUOTES.length)];

function getDashboardPath(role) {
  if (role === 'admin') return '/admin';
  if (role === 'charity_admin') return '/charity-dashboard';
  return '/dashboard';
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const storeLogin = useAuthStore((s) => s.login);
  const [showPw, setShowPw] = useState(false);

  const from = location.state?.from?.pathname || null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  async function onSubmit(data) {
    try {
      const res = await loginAPI({ email: data.email, password: data.password });
      const { user, accessToken, refreshToken } = res.data;
      storeLogin(user, { accessToken, refreshToken });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);

      if (user.role === 'user') {
        try {
          const charityRes = await getMyCharity();
          if (charityRes?.data?.data) {
            navigate(from || '/charity-dashboard', { replace: true });
            return;
          }
        } catch {
          // not a charity owner — fall through to default
        }
      }

      navigate(from || getDashboardPath(user.role), { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <motion.div {...pageVariants}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
          minHeight: 'calc(100vh - 64px)',
        }}
        className="auth-split-grid"
      >
        {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
        <div
          style={{
            background: 'linear-gradient(145deg, var(--color-primary) 0%, var(--color-primary-dark) 55%, #063535 80%, #3d2400 100%)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '60px 56px', position: 'relative', overflow: 'hidden',
          }}
          className="auth-split-left"
        >
          {/* Dot pattern */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }} aria-hidden="true">
            <defs>
              <pattern id="login-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="2" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-dots)" />
          </svg>

          {/* Amber accent circle */}
          <div style={{
            position: 'absolute', top: -80, right: -80,
            width: 320, height: 320, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(244,165,53,0.20) 0%, transparent 70%)',
          }} />

          <motion.div
            style={{ position: 'relative', zIndex: 1 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Large heart illustration */}
            <div style={{ marginBottom: 48 }}>
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{ display: 'inline-block' }}
              >
                <Heart
                  size={80}
                  fill="var(--color-accent)"
                  color="var(--color-accent)"
                  style={{ filter: 'drop-shadow(0 0 24px rgba(244,165,53,0.6))' }}
                />
              </motion.div>
            </div>

            <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 16, lineHeight: 1.3 }}>
              Welcome back.<br />
              <span style={{ color: 'var(--color-accent)' }}>Good to see you again.</span>
            </h2>

            <p style={{ color: 'rgba(255,255,255,0.70)', fontSize: 16, lineHeight: 1.7, marginBottom: 40, maxWidth: 380 }}>
              Sign in to your GiveHope account and continue making a difference in people's lives.
            </p>

            {/* Quote */}
            <div style={{ borderLeft: '3px solid var(--color-accent)', paddingLeft: 20 }}>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 8 }}>
                {quote.text}
              </p>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 600 }}>— {quote.author}</span>
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────────── */}
        <div
          style={{
            background: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '48px 32px',
          }}
          className="auth-split-right"
        >
          <motion.div
            style={{ width: '100%', maxWidth: 420 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {/* Brand mark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="7" fill="var(--color-primary)" />
                <path d="M16 26C16 26 6 19.6 6 12.5C6 9.4 8.4 7 11.5 7C13.2 7 14.8 7.9 16 9.3C17.2 7.9 18.8 7 20.5 7C23.6 7 26 9.4 26 12.5C26 19.6 16 26 16 26Z" fill="white" />
              </svg>
              <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-primary)' }}>GiveHope</span>
            </div>

            <h2 style={{ marginBottom: 6, fontSize: 'clamp(22px, 3vw, 28px)' }}>Welcome Back</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 32 }}>
              Sign in to your account to continue.{' '}
              <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Create one free</Link>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="form-group">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="priya@example.com"
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                  })}
                />

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>Password</label>
                    <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600 }}>
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Your password"
                    error={errors.password?.message}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 0 }}
                      >
                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                    {...register('password', { required: 'Password is required' })}
                  />
                </div>

                <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting} disabled={isSubmitting}>
                  Sign In <ArrowRight size={17} style={{ marginLeft: 4 }} />
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            </div>

            {/* Google button (placeholder) */}
            <button
              type="button"
              onClick={() => toast('Google sign-in coming soon!', { icon: '🔜' })}
              style={{
                width: '100%', padding: '12px 24px', borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border)', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                fontSize: 15, fontWeight: 600, color: 'var(--color-text)',
                cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4285F4'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(66,133,244,0.10)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </motion.div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 768px) {
          .auth-split-grid { grid-template-columns: 1fr !important; }
          .auth-split-left { display: none !important; }
          .auth-split-right { min-height: calc(100vh - 64px); }
        }
      `}</style>
    </motion.div>
  );
}
