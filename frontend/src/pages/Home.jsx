import { motion } from 'framer-motion';

const page = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.3 } };

export default function Home() {
  return (
    <motion.div {...page}>
      <div className="container py-24" style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: 16 }}>Your Kindness Can<br /><span style={{ color: 'var(--color-primary)' }}>Change a Life Today</span></h1>
        <p className="text-muted text-lg" style={{ maxWidth: 560, margin: '0 auto' }}>Browse verified charities and make a donation that creates real impact. Phase 10 content coming soon.</p>
      </div>
    </motion.div>
  );
}
