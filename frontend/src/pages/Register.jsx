import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { register as registerAPI } from '../api/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
};

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)        s++;
  if (/[A-Z]/.test(pw))      s++;
  if (/[0-9]/.test(pw))      s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#EF4444', '#F59E0B', '#22C55E', '#15803D'];

function PasswordStrength({ password }) {
  const score = getStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            style={{
              flex: 1, height: 4, borderRadius: 999,
              background: s <= score ? STRENGTH_COLORS[score] : 'var(--color-border)',
              transition: 'background 0.35s',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 12, color: STRENGTH_COLORS[score], fontWeight: 600 }}>
        {STRENGTH_LABELS[score]}
      </span>
    </div>
  );
}

function HandsIllustration() {
  return (
    <svg viewBox="0 0 380 260" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 340, margin: '0 auto', display: 'block' }}>
      {/* Glow rings */}
      <circle cx="190" cy="124" r="70" stroke="rgba(244,165,53,0.12)" strokeWidth="32" />
      <circle cx="190" cy="124" r="50" stroke="rgba(244,165,53,0.20)" strokeWidth="18" />

      {/* Hand: bottom-left */}
      <g transform="translate(66,222) rotate(-38)">
        <rect x="-10" y="-58" width="20" height="62" rx="10" fill="rgba(255,255,255,0.72)" />
        <rect x="-21" y="-77" width="12" height="26" rx="6" fill="rgba(255,255,255,0.72)" />
        <rect x="-11" y="-85" width="12" height="32" rx="6" fill="rgba(255,255,255,0.72)" />
        <rect x="-1"  y="-82" width="12" height="28" rx="6" fill="rgba(255,255,255,0.72)" />
        <rect x="9"   y="-74" width="12" height="20" rx="6" fill="rgba(255,255,255,0.72)" />
      </g>

      {/* Hand: bottom-center */}
      <g transform="translate(190,248) rotate(0)">
        <rect x="-10" y="-62" width="20" height="66" rx="10" fill="rgba(255,255,255,0.90)" />
        <rect x="-21" y="-83" width="12" height="28" rx="6" fill="rgba(255,255,255,0.90)" />
        <rect x="-11" y="-92" width="12" height="34" rx="6" fill="rgba(255,255,255,0.90)" />
        <rect x="-1"  y="-90" width="12" height="32" rx="6" fill="rgba(255,255,255,0.90)" />
        <rect x="9"   y="-82" width="12" height="24" rx="6" fill="rgba(255,255,255,0.90)" />
      </g>

      {/* Hand: bottom-right */}
      <g transform="translate(314,222) rotate(38)">
        <rect x="-10" y="-58" width="20" height="62" rx="10" fill="rgba(255,255,255,0.72)" />
        <rect x="-21" y="-74" width="12" height="20" rx="6" fill="rgba(255,255,255,0.72)" />
        <rect x="-11" y="-82" width="12" height="28" rx="6" fill="rgba(255,255,255,0.72)" />
        <rect x="-1"  y="-85" width="12" height="32" rx="6" fill="rgba(255,255,255,0.72)" />
        <rect x="9"   y="-77" width="12" height="26" rx="6" fill="rgba(255,255,255,0.72)" />
      </g>

      {/* Hand: left-side */}
      <g transform="translate(20,148) rotate(-72)">
        <rect x="-10" y="-52" width="20" height="56" rx="10" fill="rgba(255,255,255,0.56)" />
        <rect x="-21" y="-68" width="12" height="22" rx="6" fill="rgba(255,255,255,0.56)" />
        <rect x="-11" y="-76" width="12" height="28" rx="6" fill="rgba(255,255,255,0.56)" />
        <rect x="-1"  y="-74" width="12" height="26" rx="6" fill="rgba(255,255,255,0.56)" />
        <rect x="9"   y="-66" width="12" height="18" rx="6" fill="rgba(255,255,255,0.56)" />
      </g>

      {/* Hand: right-side */}
      <g transform="translate(360,148) rotate(72)">
        <rect x="-10" y="-52" width="20" height="56" rx="10" fill="rgba(255,255,255,0.56)" />
        <rect x="-21" y="-66" width="12" height="18" rx="6" fill="rgba(255,255,255,0.56)" />
        <rect x="-11" y="-74" width="12" height="26" rx="6" fill="rgba(255,255,255,0.56)" />
        <rect x="-1"  y="-76" width="12" height="28" rx="6" fill="rgba(255,255,255,0.56)" />
        <rect x="9"   y="-68" width="12" height="22" rx="6" fill="rgba(255,255,255,0.56)" />
      </g>

      {/* Heart */}
      <path d="M190 160 C130 132 130 90 162 90 C173 90 183 97 190 108 C197 97 207 90 218 90 C250 90 250 132 190 160 Z"
        fill="var(--color-accent)" />
      {/* Heart highlight */}
      <path d="M190 152 C147 128 147 98 165 98 C174 98 182 103 190 113 C198 103 206 98 215 98 C233 98 233 128 190 152 Z"
        fill="rgba(255,255,255,0.20)" />
    </svg>
  );
}

function RoleCard({ value, selected, onSelect, emoji, title, subtitle }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      style={{
        padding: '16px 12px', borderRadius: 12, textAlign: 'center',
        border: selected ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
        background: selected ? 'rgba(13,110,110,0.07)' : '#fff',
        cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
        flex: 1,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 6 }}>{emoji}</div>
      <div style={{ fontWeight: 600, fontSize: 14, color: selected ? 'var(--color-primary)' : 'var(--color-text)' }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>{subtitle}</div>
    </button>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState('user');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch('password', '');

  async function onSubmit(data) {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await registerAPI({ name: data.name, email: data.email, phone: data.phone, password: data.password, role });
      toast.success('Account created! Please check your email to verify.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <motion.div {...pageVariants}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
        minHeight: 'calc(100vh - 64px)',
      }}
        className="auth-split-grid"
      >
        {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-primary)', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '60px 56px',
          position: 'relative', overflow: 'hidden',
        }}
          className="auth-split-left"
        >
          {/* Dot pattern */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }} aria-hidden="true">
            <defs>
              <pattern id="reg-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="2" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#reg-dots)" />
          </svg>

          <motion.div
            style={{ position: 'relative', zIndex: 1 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div style={{ marginBottom: 40 }}>
              <HandsIllustration />
            </div>

            <blockquote style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.4, marginBottom: 28 }}>
              "Join thousands making<br />a real difference"
            </blockquote>

            {[
              'Secure & encrypted donations',
              'Manually verified charities',
              'Full transparency & impact reports',
            ].map((point) => (
              <div key={point} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                <CheckCircle size={18} color="var(--color-accent)" />
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>{point}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────────── */}
        <div style={{
          background: '#fff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '48px 32px',
        }}
          className="auth-split-right"
        >
          <motion.div
            style={{ width: '100%', maxWidth: 440 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {/* Brand mark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="7" fill="var(--color-primary)" />
                <path d="M16 26C16 26 6 19.6 6 12.5C6 9.4 8.4 7 11.5 7C13.2 7 14.8 7.9 16 9.3C17.2 7.9 18.8 7 20.5 7C23.6 7 26 9.4 26 12.5C26 19.6 16 26 16 26Z" fill="white" />
              </svg>
              <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-primary)' }}>GiveHope</span>
            </div>

            <h2 style={{ marginBottom: 6, fontSize: 'clamp(22px, 3vw, 28px)' }}>Create Your Account</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 28 }}>
              Already have one?{' '}
              <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign In</Link>
            </p>

            {/* Role selector */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <RoleCard
                value="user" selected={role === 'user'} onSelect={setRole}
                emoji="🙋" title="I want to Donate" subtitle="Personal donor account"
              />
              <RoleCard
                value="charity_admin" selected={role === 'charity_admin'} onSelect={setRole}
                emoji="🏛" title="I represent a Charity" subtitle="Charity admin account"
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="form-group">
                <Input
                  label="Full Name"
                  placeholder="Priya Sharma"
                  error={errors.name?.message}
                  {...register('name', { required: 'Full name is required' })}
                />

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

                <Input
                  label="Phone Number (optional)"
                  type="tel"
                  placeholder="+91 98765 43210"
                  error={errors.phone?.message}
                  {...register('phone', {
                    pattern: { value: /^[+\d\s()-]{7,20}$/, message: 'Enter a valid phone number' },
                  })}
                />

                <div>
                  <Input
                    label="Password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
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
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'At least 8 characters required' },
                    })}
                  />
                  <PasswordStrength password={password} />
                </div>

                <Input
                  label="Confirm Password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  error={errors.confirmPassword?.message}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 0 }}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                  {...register('confirmPassword', { required: 'Please confirm your password' })}
                />

                {/* Terms */}
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontSize: 14 }}>
                  <input
                    type="checkbox"
                    style={{ width: 16, height: 16, accentColor: 'var(--color-primary)', marginTop: 2, flexShrink: 0 }}
                    {...register('terms', { required: 'You must accept the terms to continue' })}
                  />
                  <span style={{ color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    I agree to the{' '}
                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Terms of Service</span>
                    {' '}and{' '}
                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Privacy Policy</span>
                  </span>
                </label>
                {errors.terms && (
                  <span style={{ fontSize: 13, color: 'var(--color-error)' }}>{errors.terms.message}</span>
                )}

                <Button type="submit" variant="accent" size="lg" fullWidth loading={isSubmitting} disabled={isSubmitting}>
                  Create Account
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Responsive: stack on mobile */}
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
