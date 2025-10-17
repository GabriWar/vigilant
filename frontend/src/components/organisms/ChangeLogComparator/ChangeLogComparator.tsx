/**
 * ChangeLogComparator Organism Component
 * Interface for comparing multiple change logs
 */
import React, { useState } from 'react';
import { Card } from '@components/atoms/Card/Card';
import { Button } from '@components/atoms/Button/Button';
import { Badge } from '@components/atoms/Badge/Badge';
import { Icon } from '@components/atoms/Icon/Icon';
import { Modal } from '@components/atoms/Modal/Modal';
import { ChangeLogListResponse, ChangeLogComparison } from '@types/changeLog';
import './ChangeLogComparator.css';

export interface ChangeLogComparatorProps {
  changeLogs: ChangeLogListResponse[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onCompare: (ids: number[]) => void;
  comparison?: ChangeLogComparison;
  isLoading?: boolean;
  className?: string;
}

export const ChangeLogComparator: React.FC<ChangeLogComparatorProps> = ({
  changeLogs,
  selectedIds,
  onSelectionChange,
  onCompare,
  comparison,
  isLoading = false,
  className = ''
}) => {
  const [showComparison, setShowComparison] = useState(false);

  const handleSelectChange = (id: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === changeLogs.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(changeLogs.map(log => log.id));
    }
  };

  const handleCompare = () => {
    onCompare(selectedIds);
    setShowComparison(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      <div className={`change-log-comparator ${className}`}>
        <div className="change-log-comparator-header">
          <h3 className="change-log-comparator-title">Compare Change Logs</h3>
          <div className="change-log-comparator-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="change-log-comparator-select-all"
            >
              {selectedIds.length === changeLogs.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCompare}
              disabled={selectedIds.length < 2 || isLoading}
              className="change-log-comparator-compare-btn"
            >
              <Icon name="compare" size="xs" />
              Compare ({selectedIds.length})
            </Button>
          </div>
        </div>

        <div className="change-log-comparator-list">
          {changeLogs.map((changeLog) => (
            <Card
              key={changeLog.id}
              className={`change-log-comparator-item ${
                selectedIds.includes(changeLog.id) ? 'change-log-comparator-item-selected' : ''
              }`}
              padding="sm"
            >
              <div className="change-log-comparator-item-content">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(changeLog.id)}
                  onChange={(e) => handleSelectChange(changeLog.id, e.target.checked)}
                  className="change-log-comparator-checkbox"
                />
                
                <div className="change-log-comparator-item-info">
                  <div className="change-log-comparator-item-header">
                    <Badge variant="primary" size="sm">
                      #{changeLog.id}
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      {changeLog.change_type}
                    </Badge>
                    <span className="change-log-comparator-item-date">
                      {formatDate(changeLog.detected_at)}
                    </span>
                  </div>
                  
                  <div className="change-log-comparator-item-details">
                    <span className="change-log-comparator-item-source">
                      {changeLog.watcher_name || 'Unknown'}
                    </span>
                    <span className="change-log-comparator-item-size">
                      {formatSize(changeLog.new_size)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Comparison Modal */}
      <Modal
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        title="Change Logs Comparison"
        size="xl"
      >
        {comparison && (
          <div className="change-log-comparison">
            <div className="change-log-comparison-metadata">
              <p>Comparing {comparison.change_logs.length} change logs</p>
              {comparison.comparison_metadata.date_range && (
                <p>
                  Period: {formatDate(comparison.comparison_metadata.date_range.from)} - {formatDate(comparison.comparison_metadata.date_range.to)}
                </p>
              )}
            </div>

            <div className="change-log-comparison-content">
              {comparison.change_logs.map((log, index) => (
                <div key={log.id} className="change-log-comparison-item">
                  <div className="change-log-comparison-item-header">
                    <h4>#{log.id} - {log.change_type}</h4>
                    <span>{formatDate(log.detected_at)}</span>
                  </div>
                  
                  <div className="change-log-comparison-item-info">
                    <p><strong>Source:</strong> {log.watcher_name}</p>
                    <p><strong>Size:</strong> {formatSize(log.new_size)}</p>
                  </div>
                  
                  {log.diff && (
                    <div className="change-log-comparison-item-diff">
                      <h5>Diff:</h5>
                      <pre className="change-log-comparison-diff-content">
                        {log.diff}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
