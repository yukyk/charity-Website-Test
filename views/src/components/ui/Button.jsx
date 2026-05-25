import { motion } from 'framer-motion';
import Spinner from './Spinner';

export default function Button({
  children,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  fullWidth = false,
  type     = 'button',
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      whileTap={!isDisabled ? { scale: 0.97 } : undefined}
      className={[
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth ? 'btn-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </motion.button>
  );
}
