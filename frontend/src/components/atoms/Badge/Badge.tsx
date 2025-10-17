/**
 * Badge Atom Component
 * Small status indicators and labels
 */

import React from 'react';
import './Badge.css';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const badgeClass = `badge badge-${variant} badge-${size} ${dot ? 'badge-dot' : ''} ${className}`;

  return (
    <span className={badgeClass}>
      {dot && <span className="badge-dot-indicator"></span>}
      {children}
    </span>
  );
};
