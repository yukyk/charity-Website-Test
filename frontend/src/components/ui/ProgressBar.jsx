import { motion } from 'framer-motion';

export default function ProgressBar({
  value           = 0,
  max             = 100,
  label           = '',
  showPercentage  = true,
  className       = '',
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className={['progress-wrapper', className].filter(Boolean).join(' ')}>
      {(label || showPercentage) && (
        <div className="progress-header">
          {label && <span>{label}</span>}
          {showPercentage && <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{pct}%</span>}
        </div>
      )}
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}
