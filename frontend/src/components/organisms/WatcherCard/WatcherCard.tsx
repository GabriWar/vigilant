import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Watcher } from '@/types/watcher';
import { Card } from '@components/atoms/Card/Card';
import { Badge } from '@components/atoms/Badge/Badge';
import { Button } from '@components/atoms/Button/Button';
import { Icon } from '@components/atoms/Icon/Icon';
import { ExecutionModeBadge } from '@components/atoms/ExecutionModeBadge';
import { useExecuteWatcher } from '@/hooks/useWatchers';
import './WatcherCard.css';

interface WatcherCardProps {
  watcher: Watcher;
  onEdit?: (watcher: Watcher) => void;
  onDelete?: (watcher: Watcher) => void;
  onViewLogs?: (watcher: Watcher) => void;
}

export const WatcherCard: React.FC<WatcherCardProps> = ({
  watcher,
  onEdit,
  onDelete,
  onViewLogs
}) => {
  const executeWatcher = useExecuteWatcher();

  const handleExecute = async () => {
    try {
      await executeWatcher.mutateAsync(watcher.id);
    } catch (error) {
      console.error('Failed to execute watcher:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatLastChecked = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      return formatDistanceToNow(new Date(dateString + 'Z'), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const formatLastChanged = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      return formatDistanceToNow(new Date(dateString + 'Z'), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Card className="watcher-card">
      <div className="watcher-card-header">
        <div className="watcher-card-title">
          <h3 className="watcher-name">{watcher.name}</h3>
          <ExecutionModeBadge mode={watcher.execution_mode} />
        </div>
        <div className="watcher-card-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExecute}
            disabled={executeWatcher.isPending || !watcher.is_active}
            className="execute-button"
          >
            <Icon name="play" />
            Execute
          </Button>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(watcher)}
            >
              <Icon name="edit" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(watcher)}
              className="delete-button"
            >
              <Icon name="trash" />
            </Button>
          )}
        </div>
      </div>

      <div className="watcher-card-content">
        <div className="watcher-url">
          <Icon name="link" />
          <span className="url-text">{watcher.url}</span>
        </div>

        <div className="watcher-method">
          <Badge variant="outline" className="method-badge">
            {watcher.method}
          </Badge>
        </div>

        <div className="watcher-status">
          <Badge variant={getStatusColor(watcher.status)}>
            {watcher.status}
          </Badge>
          {watcher.error_message && (
            <span className="error-message">{watcher.error_message}</span>
          )}
        </div>

        <div className="watcher-stats">
          <div className="stat-item">
            <Icon name="eye" />
            <span>{watcher.check_count} checks</span>
          </div>
          <div className="stat-item">
            <Icon name="alert" />
            <span>{watcher.change_count} changes</span>
          </div>
        </div>

        <div className="watcher-timestamps">
          <div className="timestamp-item">
            <span className="timestamp-label">Last checked:</span>
            <span className="timestamp-value">{formatLastChecked(watcher.last_checked_at)}</span>
          </div>
          <div className="timestamp-item">
            <span className="timestamp-label">Last changed:</span>
            <span className="timestamp-value">{formatLastChanged(watcher.last_changed_at)}</span>
          </div>
        </div>

        {watcher.watch_interval && (
          <div className="watcher-interval">
            <Icon name="clock" />
            <span>Every {watcher.watch_interval}s</span>
          </div>
        )}

        <div className="watcher-features">
          {watcher.save_cookies && (
            <Badge variant="outline" className="feature-badge">
              <Icon name="cookie" />
              Save Cookies
            </Badge>
          )}
          {watcher.use_cookies && (
            <Badge variant="outline" className="feature-badge">
              <Icon name="cookie" />
              Use Cookies
            </Badge>
          )}
        </div>
      </div>

      <div className="watcher-card-footer">
        {onViewLogs && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewLogs(watcher)}
            className="view-logs-button"
          >
            <Icon name="list" />
            View Logs
          </Button>
        )}
      </div>
    </Card>
  );
};
