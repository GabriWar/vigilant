/**
 * Spinner Atom Component
 * Loading indicator
 */

import React from 'react';
import './Spinner.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white' | 'gray';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
}) => {
  const spinnerClass = `spinner spinner-${size} spinner-${variant} ${className}`;

  return (
    <div className={spinnerClass} role="status" aria-label="Loading">
      <svg viewBox="0 0 50 50" className="spinner-svg">
        <circle
          className="spinner-circle"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
      </svg>
    </div>
  );
};
