import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, icon, rightElement, id, className = '', type = 'text', ...props },
  ref
) {
  return (
    <div className="input-wrapper">
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}
      <div className="input-field-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          ref={ref}
          id={id}
          type={type}
          className={[
            'input-field',
            icon         ? 'with-icon'  : '',
            rightElement ? 'with-right' : '',
            error        ? 'has-error'  : '',
            className,
          ].filter(Boolean).join(' ')}
          {...props}
        />
        {rightElement && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
            {rightElement}
          </span>
        )}
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
});

export default Input;
