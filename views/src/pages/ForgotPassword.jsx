import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { forgotPassword } from '../api/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

function SuccessState({ email }) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ textAlign: 'center' }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
        style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(34,197,94,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}
      >
        <CheckCircle size={40} color="var(--color-success)" />
      </motion.div>

      <h2 style={{ marginBottom: 12 }}>Check Your Email</h2>
      <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 8 }}>
        We've sent a password reset link to:
      </p>
      <p style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 16, marginBottom: 24 }}>{email}</p>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
        Click the link in the email to reset your password.
        The link expires in 1 hour. If you don't see the email, check your spam folder.
      </p>

      <Link to="/login">
        <Button variant="primary" size="md" fullWidth>
          Back to Sign In
        </Button>
      </Link>
    </motion.div>
  );
}

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  async function onSubmit(data) {
    try {
      await forgotPassword(data.email);
      setSentEmail(data.email);
      setSent(true);
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <motion.div {...pageVariants}>
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: 460 }}>

          {/* Brand */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="7" fill="var(--color-primary)" />
              <path d="M16 26C16 26 6 19.6 6 12.5C6 9.4 8.4 7 11.5 7C13.2 7 14.8 7.9 16 9.3C17.2 7.9 18.8 7 20.5 7C23.6 7 26 9.4 26 12.5C26 19.6 16 26 16 26Z" fill="white" />
            </svg>
          </div>

          <AnimatePresence mode="wait">
            {sent ? (
              <SuccessState key="success" email={sentEmail} />
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Icon */}
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(13,110,110,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px', color: 'var(--color-primary)',
                }}>
                  <Mail size={30} />
                </div>

                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <h2 style={{ marginBottom: 8 }}>Forgot Password?</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 15, lineHeight: 1.65 }}>
                    No worries. Enter your email and we'll send you a reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div style={{ marginBottom: 20 }}>
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="priya@example.com"
                      icon={<Mail size={16} />}
                      error={errors.email?.message}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                      })}
                    />
                  </div>

                  <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting} disabled={isSubmitting}>
                    Send Reset Link
                  </Button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <Link
                    to="/login"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 500 }}
                  >
                    <ArrowLeft size={15} /> Back to Sign In
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
