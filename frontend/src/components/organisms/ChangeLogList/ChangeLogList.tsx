/**
 * ChangeLogList Organism Component
 * List of change log cards with pagination
 */
import React from 'react';
import { ChangeLogCard } from '../ChangeLogCard/ChangeLogCard';
import { Spinner } from '@components/atoms/Spinner/Spinner';
import { Button } from '@components/atoms/Button/Button';
import { ChangeLogListResponse } from '@types/changeLog';
import './ChangeLogList.css';

export interface ChangeLogListProps {
  changeLogs: ChangeLogListResponse[];
  isLoading?: boolean;
  onViewDiff?: (changeLog: ChangeLogListResponse) => void;
  onViewWatcher?: (watcherId: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export const ChangeLogList: React.FC<ChangeLogListProps> = ({
  changeLogs,
  isLoading = false,
  onViewDiff,
  onViewWatcher,
  onLoadMore,
  hasMore = false,
  className = ''
}) => {
  if (isLoading && changeLogs.length === 0) {
    return (
      <div className={`change-log-list-loading ${className}`}>
        <Spinner size="xl" />
        <p>Loading change logs...</p>
      </div>
    );
  }

  if (changeLogs.length === 0) {
    return (
      <div className={`change-log-list-empty ${className}`}>
        <p>No change logs found</p>
      </div>
    );
  }

  return (
    <div className={`change-log-list ${className}`}>
      <div className="change-log-list-grid">
        {changeLogs.map((changeLog) => (
          <ChangeLogCard
            key={changeLog.id}
            changeLog={changeLog}
            onViewDiff={onViewDiff}
            onViewWatcher={onViewWatcher}
          />
        ))}
      </div>

      {hasMore && (
        <div className="change-log-list-load-more">
          <Button
            variant="secondary"
            onClick={onLoadMore}
            disabled={isLoading}
            className="change-log-list-load-more-btn"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
};
