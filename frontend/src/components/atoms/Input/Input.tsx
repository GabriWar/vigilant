/**
 * Input Atom Component
 * Reusable input field with various styles and states
 */

import React, { InputHTMLAttributes, forwardRef } from 'react';
import './Input.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      icon,
      iconPosition = 'left',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const containerClass = `input-container ${fullWidth ? 'input-full-width' : ''} ${className}`;
    const inputClass = `input ${error ? 'input-error' : ''} ${disabled ? 'input-disabled' : ''} ${
      icon ? `input-with-icon-${iconPosition}` : ''
    }`;

    return (
      <div className={containerClass}>
        {label && (
          <label className="input-label" htmlFor={props.id}>
            {label}
          </label>
        )}
        <div className="input-wrapper">
          {icon && iconPosition === 'left' && <span className="input-icon input-icon-left">{icon}</span>}
          <input ref={ref} className={inputClass} disabled={disabled} {...props} />
          {icon && iconPosition === 'right' && <span className="input-icon input-icon-right">{icon}</span>}
        </div>
        {error && <span className="input-error-text">{error}</span>}
        {helperText && !error && <span className="input-helper-text">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
