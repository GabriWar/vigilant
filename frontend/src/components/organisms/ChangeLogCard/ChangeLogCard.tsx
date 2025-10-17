/**
 * ChangeLogCard Organism Component
 * Card displaying individual change log information
 */
import React from 'react';
import { Card } from '@components/atoms/Card/Card';
import { Badge } from '@components/atoms/Badge/Badge';
import { Button } from '@components/atoms/Button/Button';
import { Icon } from '@components/atoms/Icon/Icon';
import { DiffViewer } from '../DiffViewer/DiffViewer';
import { ChangeLogListResponse } from '@types/changeLog';
import { formatDistanceToNow } from 'date-fns';
import { useChangeLog } from '@hooks/useChangeLogs';
import './ChangeLogCard.css';

export interface ChangeLogCardProps {
  changeLog: ChangeLogListResponse;
  onViewDiff?: (changeLog: ChangeLogListResponse) => void;
  onViewWatcher?: (watcherId: number) => void;
  className?: string;
}

export const ChangeLogCard: React.FC<ChangeLogCardProps> = ({
  changeLog,
  onViewDiff,
  onViewWatcher,
  className = ''
}) => {
  const [showDiff, setShowDiff] = React.useState(false);
  const { data: changeLogDetail, isLoading: isLoadingDiff } = useChangeLog(
    changeLog.id,
    { enabled: showDiff }
  );

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'new':
        return 'success';
      case 'modified':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'gray';
    }
  };

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'new':
        return 'New';
      case 'modified':
        return 'Modified';
      case 'error':
        return 'Error';
      default:
        return type;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    // Parse the date string and treat it as local time
    const date = new Date(dateString + 'Z'); // Add Z to treat as UTC
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const handleViewDiff = () => {
    if (onViewDiff) {
      onViewDiff(changeLog);
    } else {
      setShowDiff(true);
    }
  };

  const handleWatcherClick = () => {
    if (changeLog.watcher_id && onViewWatcher) {
      onViewWatcher(changeLog.watcher_id);
    }
  };

  return (
    <>
      <Card className={`change-log-card ${className}`} padding="md">
        <div className="change-log-card-header">
          <div className="change-log-card-title">
            <Badge variant={getChangeTypeColor(changeLog.change_type)} size="sm">
              {getChangeTypeLabel(changeLog.change_type)}
            </Badge>
            <span className="change-log-card-id">#{changeLog.id}</span>
          </div>
          <div className="change-log-card-time">
            <Icon name="clock" size="xs" />
            <span>{formatDate(changeLog.detected_at)}</span>
          </div>
        </div>

        <div className="change-log-card-content">
          <div className="change-log-card-source">
            <div className="change-log-card-source-item">
              <Icon name="monitor" size="xs" />
              <span className="change-log-card-source-label">Watcher:</span>
              <button
                className="change-log-card-source-link"
                onClick={handleWatcherClick}
              >
                {changeLog.watcher_name}
              </button>
            </div>
          </div>

          <div className="change-log-card-stats">
            <div className="change-log-card-stat">
              <Icon name="file" size="xs" />
              <span className="change-log-card-stat-label">Size:</span>
              <span className="change-log-card-stat-value">
                {formatSize(changeLog.new_size)}
                {changeLog.old_size && (
                  <span className="change-log-card-size-change">
                    {' '}({changeLog.old_size > changeLog.new_size ? '-' : '+'}
                    {formatSize(Math.abs(changeLog.new_size - changeLog.old_size))})
                  </span>
                )}
              </span>
            </div>

            {changeLog.watcher_url && (
              <div className="change-log-card-stat">
                <Icon name="link" size="xs" />
                <span className="change-log-card-stat-label">URL:</span>
                <a
                  href={changeLog.watcher_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="change-log-card-url"
                >
                  {changeLog.watcher_url.length > 50 
                    ? changeLog.watcher_url.substring(0, 50) + '...'
                    : changeLog.watcher_url
                  }
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="change-log-card-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleViewDiff}
            className="change-log-card-action-btn"
          >
            <Icon name="eye" size="xs" />
            View Diff
          </Button>
          
          {changeLog.archive_path && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(changeLog.archive_path, '_blank')}
              className="change-log-card-action-btn"
            >
              <Icon name="download" size="xs" />
              Archive
            </Button>
          )}
        </div>
      </Card>

      {/* Diff Viewer Modal */}
      <DiffViewer
        isOpen={showDiff}
        onClose={() => setShowDiff(false)}
        diff={
          isLoadingDiff 
            ? "Loading diff..." 
            : changeLogDetail?.diff || "No diff available"
        }
        title={`Diff - ${getChangeTypeLabel(changeLog.change_type)} #${changeLog.id}`}
        oldSize={changeLog.old_size}
        newSize={changeLog.new_size}
      />
    </>
  );
};
