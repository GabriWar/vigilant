/**
 * LogViewer Organism Component
 * Displays change logs with diff viewing capability
 */

import React, { useState } from 'react';
import { Card } from '../../atoms/Card/Card';
import { Badge } from '../../atoms/Badge/Badge';
import { Icon } from '../../atoms/Icon/Icon';
import './LogViewer.css';

export interface ChangeLog {
  id: number;
  monitor_id: number;
  change_type: string;
  old_size?: number;
  new_size: number;
  detected_at: string;
  diff?: string;
  monitor_name?: string;
}

export interface LogViewerProps {
  logs: ChangeLog[];
  onViewDiff?: (log: ChangeLog) => void;
  onDownloadArchive?: (log: ChangeLog) => void;
  className?: string;
}

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  onViewDiff,
  onDownloadArchive,
  className = '',
}) => {
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getSizeDelta = (log: ChangeLog) => {
    if (!log.old_size) return null;
    const delta = log.new_size - log.old_size;
    const isIncrease = delta > 0;
    return {
      delta: Math.abs(delta),
      isIncrease,
      icon: isIncrease ? 'arrowUp' : 'arrowDown',
      color: isIncrease ? 'var(--color-success)' : 'var(--color-error)',
    };
  };

  const toggleExpand = (logId: number) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  return (
    <div className={`log-viewer ${className}`}>
      {logs.length === 0 ? (
        <Card padding="lg" className="log-viewer-empty">
          <Icon name="info" size="lg" />
          <p>No changes detected yet</p>
        </Card>
      ) : (
        <div className="log-viewer-list">
          {logs.map((log) => {
            const sizeDelta = getSizeDelta(log);
            const isExpanded = expandedLog === log.id;

            return (
              <Card key={log.id} variant="default" padding="md" className="log-viewer-item">
                <div className="log-viewer-header" onClick={() => toggleExpand(log.id)}>
                  <div className="log-viewer-info">
                    <div className="log-viewer-icon">
                      <Icon name="exclamation" size="md" />
                    </div>
                    <div className="log-viewer-details">
                      <div className="log-viewer-title">
                        {log.monitor_name || `Monitor #${log.monitor_id}`}
                      </div>
                      <div className="log-viewer-timestamp">
                        <Icon name="clock" size="xs" />
                        {formatDate(log.detected_at)}
                      </div>
                    </div>
                  </div>

                  <div className="log-viewer-metadata">
                    <Badge variant="warning" size="sm">
                      {log.change_type}
                    </Badge>
                    <div className="log-viewer-size">
                      <span className="log-viewer-size-label">Size:</span>
                      <span className="log-viewer-size-value">{formatBytes(log.new_size)}</span>
                      {sizeDelta && (
                        <span className="log-viewer-size-delta" style={{ color: sizeDelta.color }}>
                          <Icon name={sizeDelta.icon} size="xs" />
                          {formatBytes(sizeDelta.delta)}
                        </span>
                      )}
                    </div>
                    <Icon
                      name={isExpanded ? 'chevronUp' : 'chevronDown'}
                      size="sm"
                      className="log-viewer-expand-icon"
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="log-viewer-content">
                    <div className="log-viewer-actions">
                      {onViewDiff && log.diff && (
                        <button onClick={() => onViewDiff(log)} className="log-viewer-action">
                          <Icon name="eye" size="sm" />
                          View Diff
                        </button>
                      )}
                      {onDownloadArchive && (
                        <button onClick={() => onDownloadArchive(log)} className="log-viewer-action">
                          <Icon name="arrowDown" size="sm" />
                          Download Archive
                        </button>
                      )}
                    </div>

                    {log.diff && (
                      <div className="log-viewer-diff">
                        <pre className="log-viewer-diff-content">{log.diff}</pre>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
