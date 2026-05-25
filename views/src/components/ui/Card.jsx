import { motion } from 'framer-motion';

export default function Card({
  children,
  hover     = true,
  padding   = '24px',
  className = '',
  style     = {},
  ...props
}) {
  return (
    <motion.div
      className={['card', hover ? 'card-hover' : '', className].filter(Boolean).join(' ')}
      style={{ padding, ...style }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
