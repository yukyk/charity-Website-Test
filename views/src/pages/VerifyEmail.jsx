import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Info, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

export default function VerifyEmail() {
  return (
    <motion.div {...pageVariants}>
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: 440, textAlign: 'center' }}>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="7" fill="var(--color-primary)" />
              <path d="M16 26C16 26 6 19.6 6 12.5C6 9.4 8.4 7 11.5 7C13.2 7 14.8 7.9 16 9.3C17.2 7.9 18.8 7 20.5 7C23.6 7 26 9.4 26 12.5C26 19.6 16 26 16 26Z" fill="white" />
            </svg>
          </div>

          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(13,110,110,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', color: 'var(--color-primary)',
          }}>
            <Info size={32} />
          </div>

          <h2 style={{ marginBottom: 12 }}>Email Verification Not Required</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 32, maxWidth: 340, margin: '0 auto 32px' }}>
            This platform does not require email verification.
            You can log in directly with your credentials.
          </p>

          <Link to="/login">
            <Button variant="accent" size="lg">
              Go to Login <ArrowRight size={17} style={{ marginLeft: 4 }} />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
