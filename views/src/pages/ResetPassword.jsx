import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import { resetPassword } from '../api/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
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

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const token = searchParams.get('token');

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
      await resetPassword({ token, newPassword: data.password });
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!token) {
    return (
      <motion.div {...pageVariants}>
        <div className="auth-page">
          <div className="auth-card" style={{ maxWidth: 440, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--color-error)' }}>
              <AlertCircle size={32} />
            </div>
            <h2 style={{ marginBottom: 12 }}>Invalid Reset Link</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 28, lineHeight: 1.7 }}>
              This reset link is missing or invalid. Please request a new one.
            </p>
            <Link to="/forgot-password">
              <Button variant="primary" size="md" fullWidth>Request New Link</Button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageVariants}>
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: 440 }}>

          {/* Brand */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="7" fill="var(--color-primary)" />
              <path d="M16 26C16 26 6 19.6 6 12.5C6 9.4 8.4 7 11.5 7C13.2 7 14.8 7.9 16 9.3C17.2 7.9 18.8 7 20.5 7C23.6 7 26 9.4 26 12.5C26 19.6 16 26 16 26Z" fill="white" />
            </svg>
          </div>

          {/* Lock icon */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(13,110,110,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', color: 'var(--color-primary)',
          }}>
            <Lock size={30} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h2 style={{ marginBottom: 8 }}>Reset Your Password</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 15, lineHeight: 1.65 }}>
              Choose a strong new password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-group">
              <div>
                <Input
                  label="New Password"
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
                label="Confirm New Password"
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

              <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting} disabled={isSubmitting}>
                Reset Password
              </Button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--color-text-muted)' }}>
            Remembered it?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign In</Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
