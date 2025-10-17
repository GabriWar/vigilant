/**
 * Card Atom Component
 * Container with shadow and border
 */

import React from 'react';
import './Card.css';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
}) => {
  const cardClass = `card card-${variant} card-padding-${padding} ${
    onClick ? 'card-clickable' : ''
  } ${className}`;

  return (
    <div className={cardClass} onClick={onClick} role={onClick ? 'button' : undefined}>
      {children}
    </div>
  );
};
