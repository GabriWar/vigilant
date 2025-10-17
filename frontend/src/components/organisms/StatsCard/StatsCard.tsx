/**
 * StatsCard Organism Component
 * Display statistics with icon and trend
 */

import React from 'react';
import { Card } from '../../atoms/Card/Card';
import { Icon } from '../../atoms/Icon/Icon';
import './StatsCard.css';

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  className = '',
}) => {
  const colorClasses = {
    primary: 'stats-card-primary',
    success: 'stats-card-success',
    warning: 'stats-card-warning',
    error: 'stats-card-error',
  };

  return (
    <Card variant="elevated" padding="md" className={`stats-card ${className}`}>
      <div className="stats-card-content">
        <div className="stats-card-info">
          <div className="stats-card-title">{title}</div>
          <div className="stats-card-value">{value}</div>
          {trend && (
            <div className={`stats-card-trend ${trend.isPositive ? 'stats-card-trend-up' : 'stats-card-trend-down'}`}>
              <Icon name={trend.isPositive ? 'arrowUp' : 'arrowDown'} size="xs" />
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={`stats-card-icon ${colorClasses[color]}`}>
          <Icon name={icon} size="lg" />
        </div>
      </div>
    </Card>
  );
};
