import { motion } from 'framer-motion';

const page = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

export default function AdminDashboard() {
  return (
    <motion.div {...page}>
      <div className="container py-24" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: 12, color: 'var(--color-primary)' }}>Platform Admin</h2>
        <p className="text-muted">Full admin dashboard coming in Phase 14.</p>
      </div>
    </motion.div>
  );
}
