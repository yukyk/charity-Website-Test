import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, icon, id, className = '', type = 'text', ...props },
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
            icon     ? 'with-icon'  : '',
            error    ? 'has-error'  : '',
            className,
          ].filter(Boolean).join(' ')}
          {...props}
        />
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
});

export default Input;
