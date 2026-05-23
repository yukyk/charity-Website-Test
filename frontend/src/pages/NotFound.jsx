import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const page = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

export default function NotFound() {
  return (
    <motion.div {...page}>
      <div className="container py-24" style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 80, fontWeight: 800, color: 'var(--color-border)', lineHeight: 1, marginBottom: 16 }}>404</p>
        <h2 style={{ marginBottom: 12 }}>Page Not Found</h2>
        <p className="text-muted" style={{ marginBottom: 32 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button variant="primary" size="lg">Back to Home</Button>
        </Link>
      </div>
    </motion.div>
  );
}
