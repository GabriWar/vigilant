/**
 * StatusBadge Molecule Component
 * Badge showing monitor status with appropriate color and icon
 */

import React from 'react';
import { Badge } from '../../atoms/Badge/Badge';
import { Icon } from '../../atoms/Icon/Icon';
import './StatusBadge.css';

export interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'checking' | 'error' | 'changed';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  active: {
    label: 'Active',
    variant: 'success' as const,
    icon: 'check',
  },
  inactive: {
    label: 'Inactive',
    variant: 'gray' as const,
    icon: 'x',
  },
  checking: {
    label: 'Checking',
    variant: 'primary' as const,
    icon: 'refresh',
  },
  error: {
    label: 'Error',
    variant: 'error' as const,
    icon: 'exclamation',
  },
  changed: {
    label: 'Changed',
    variant: 'warning' as const,
    icon: 'info',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} className={className} dot={!showIcon}>
      {showIcon && <Icon name={config.icon} size="xs" />}
      {config.label}
    </Badge>
  );
};
