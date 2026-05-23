export default function Spinner({ size = 'md', className = '' }) {
  return (
    <div
      className={`spinner spinner-${size}${className ? ` ${className}` : ''}`}
      role="status"
      aria-label="Loading"
    />
  );
}
