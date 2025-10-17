/**
 * MonitorCard Organism Component
 * Displays monitor information with actions
 */

import React from 'react';
import { Card } from '../../atoms/Card/Card';
import { Badge } from '../../atoms/Badge/Badge';
import { Icon } from '../../atoms/Icon/Icon';
import { StatusBadge } from '../../molecules/StatusBadge/StatusBadge';
import { Monitor } from '../../../types/monitor';
import './MonitorCard.css';

export interface MonitorCardProps {
  monitor: Monitor;
  onEdit?: (monitor: Monitor) => void;
  onDelete?: (monitor: Monitor) => void;
  onToggleStatus?: (monitor: Monitor) => void;
  onRefetch?: (monitor: Monitor) => void;
  onClick?: (monitor: Monitor) => void;
  isRefetching?: boolean;
}

export const MonitorCard: React.FC<MonitorCardProps> = ({
  monitor,
  onEdit,
  onDelete,
  onToggleStatus,
  onRefetch,
  onClick,
  isRefetching = false,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const handleCardClick = () => {
    if (onClick) onClick(monitor);
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card variant="elevated" padding="md" className="monitor-card" onClick={handleCardClick}>
      <div className="monitor-card-header">
        <div className="monitor-card-title-section">
          <div className="monitor-card-icon">
            <Icon name="monitor" size="md" />
          </div>
          <div>
            <h3 className="monitor-card-title">{monitor.name}</h3>
            <a
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="monitor-card-url"
              onClick={stopPropagation}
            >
              {monitor.url}
            </a>
          </div>
        </div>

        <div className="monitor-card-actions" onClick={stopPropagation}>
          {onRefetch && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefetch(monitor);
              }}
              className="monitor-card-action"
              title="Test Request"
              disabled={isRefetching}
            >
              <Icon name={isRefetching ? "loader" : "refresh"} size="sm" className={isRefetching ? "animate-spin" : ""} />
            </button>
          )}
          {onToggleStatus && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(monitor);
              }}
              className="monitor-card-action"
              title={monitor.is_active ? 'Pause' : 'Resume'}
            >
              <Icon name={monitor.is_active ? 'eyeOff' : 'eye'} size="sm" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(monitor);
              }}
              className="monitor-card-action"
              title="Edit"
            >
              <Icon name="edit" size="sm" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(monitor);
              }}
              className="monitor-card-action monitor-card-action-danger"
              title="Delete"
            >
              <Icon name="trash" size="sm" />
            </button>
          )}
        </div>
      </div>

      <div className="monitor-card-body">
        <div className="monitor-card-badges">
          <StatusBadge status={monitor.is_active ? 'active' : 'inactive'} size="sm" />
          <Badge variant="gray" size="sm">
            <Icon name="clock" size="xs" />
            {monitor.watch_interval}s
          </Badge>
          <Badge variant="primary" size="sm">
            {monitor.monitor_type}
          </Badge>
        </div>

        <div className="monitor-card-stats">
          <div className="monitor-card-stat">
            <Icon name="chart" size="sm" className="monitor-card-stat-icon" />
            <div>
              <div className="monitor-card-stat-label">Checks</div>
              <div className="monitor-card-stat-value">{monitor.check_count || 0}</div>
            </div>
          </div>

          <div className="monitor-card-stat">
            <Icon name="exclamation" size="sm" className="monitor-card-stat-icon" />
            <div>
              <div className="monitor-card-stat-label">Changes</div>
              <div className="monitor-card-stat-value">{monitor.change_count || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="monitor-card-footer">
        <div className="monitor-card-timestamp">
          <Icon name="clock" size="xs" />
          <span>Last checked: {formatDate(monitor.last_checked_at)}</span>
        </div>
        {monitor.last_changed_at && (
          <div className="monitor-card-timestamp monitor-card-change">
            <Icon name="info" size="xs" />
            <span>Last changed: {formatDate(monitor.last_changed_at)}</span>
          </div>
        )}
      </div>

      {monitor.error_message && (
        <div className="monitor-card-error">
          <Icon name="exclamation" size="sm" />
          <span>{monitor.error_message}</span>
        </div>
      )}
    </Card>
  );
};
