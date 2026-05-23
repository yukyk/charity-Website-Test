import { getInitials } from '../../utils/formatters';

export default function Avatar({ name, src, size = 'md', className = '', style = {} }) {
  return (
    <div
      className={['avatar', `avatar-${size}`, className].filter(Boolean).join(' ')}
      style={style}
      title={name}
      aria-label={name}
    >
      {src ? (
        <img src={src} alt={name || 'Avatar'} />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}
