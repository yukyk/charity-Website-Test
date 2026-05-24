import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowRight, Mail } from 'lucide-react';
import { verifyEmail } from '../api/auth';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

function AnimatedCheckmark() {
  return (
    <div style={{
      width: 96, height: 96, borderRadius: '50%',
      background: 'rgba(34,197,94,0.10)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 28px',
    }}>
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="28" fill="rgba(34,197,94,0.15)" />
        <motion.path
          d="M16 28 L24 36 L40 20"
          stroke="#22C55E"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
    </div>
  );
}

function LoadingState() {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ textAlign: 'center' }}
    >
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(13,110,110,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
      }}>
        <Spinner size="md" />
      </div>
      <h2 style={{ marginBottom: 10 }}>Verifying Your Email</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 15, lineHeight: 1.65 }}>
        Please wait while we verify your email address…
      </p>
    </motion.div>
  );
}

function SuccessState() {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ textAlign: 'center' }}
    >
      <AnimatedCheckmark />
      <h2 style={{ marginBottom: 12 }}>Email Verified!</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 32, maxWidth: 360, margin: '0 auto 32px' }}>
        Your email address has been successfully verified.
        You can now sign in and start making a difference.
      </p>
      <Link to="/login">
        <Button variant="accent" size="lg">
          Proceed to Sign In <ArrowRight size={17} style={{ marginLeft: 4 }} />
        </Button>
      </Link>
    </motion.div>
  );
}

function ErrorState({ message, noToken }) {
  return (
    <motion.div
      key="error"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ textAlign: 'center' }}
    >
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(239,68,68,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px', color: 'var(--color-error)',
      }}>
        {noToken ? <Mail size={36} /> : <AlertCircle size={36} />}
      </div>

      <h2 style={{ marginBottom: 12 }}>{noToken ? 'No Token Found' : 'Verification Failed'}</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 32, maxWidth: 360, margin: '0 auto 32px' }}>
        {noToken
          ? 'It looks like you opened this page directly. Please click the verification link in your email.'
          : (message || 'This verification link may have expired or already been used. Please register again or contact support.')}
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/register">
          <Button variant="primary" size="md">Register Again</Button>
        </Link>
        <Link to="/login">
          <Button variant="secondary" size="md">Back to Sign In</Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState(token ? 'loading' : 'no-token');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setErrorMessage(err.message);
        setStatus('error');
      });
  }, [token]);

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
            {status === 'loading'   && <LoadingState key="loading" />}
            {status === 'success'   && <SuccessState key="success" />}
            {status === 'error'     && <ErrorState key="error" message={errorMessage} />}
            {status === 'no-token'  && <ErrorState key="no-token" noToken />}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
