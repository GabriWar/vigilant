import React, { useState } from 'react';
import { Watcher } from '@/types/watcher';
import { WatcherCard } from '../WatcherCard/WatcherCard';
import { Spinner } from '@components/atoms/Spinner/Spinner';
import { Button } from '@components/atoms/Button/Button';
import { Icon } from '@components/atoms/Icon/Icon';
import { useWatchers, useDeleteWatcher } from '@/hooks/useWatchers';
import './WatcherList.css';

interface WatcherListProps {
  filters?: {
    is_active?: boolean;
    execution_mode?: string;
    content_type?: string;
    search?: string;
  };
  onEdit?: (watcher: Watcher) => void;
  onViewLogs?: (watcher: Watcher) => void;
  onCreateNew?: () => void;
}

export const WatcherList: React.FC<WatcherListProps> = ({
  filters,
  onEdit,
  onViewLogs,
  onCreateNew
}) => {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: watchers, isLoading, error } = useWatchers({
    skip: page * limit,
    limit,
    ...filters
  });

  const deleteWatcher = useDeleteWatcher();

  const handleDelete = async (watcher: Watcher) => {
    if (window.confirm(`Are you sure you want to delete "${watcher.name}"?`)) {
      try {
        await deleteWatcher.mutateAsync(watcher.id);
      } catch (error) {
        console.error('Failed to delete watcher:', error);
      }
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleLoadPrevious = () => {
    setPage(prev => Math.max(0, prev - 1));
  };

  if (isLoading && page === 0) {
    return (
      <div className="watcher-list-loading">
        <Spinner size="large" />
        <p>Loading watchers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="watcher-list-error">
        <Icon name="alert" />
        <p>Failed to load watchers: {error.message}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!watchers || watchers.length === 0) {
    return (
      <div className="watcher-list-empty">
        <Icon name="eye" />
        <h3>No watchers found</h3>
        <p>
          {filters && Object.keys(filters).length > 0
            ? 'Try adjusting your filters or create a new watcher.'
            : 'Create your first watcher to start monitoring websites and APIs.'
          }
        </p>
        {onCreateNew && (
          <Button onClick={onCreateNew} className="create-first-button">
            <Icon name="plus" />
            Create First Watcher
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="watcher-list">
      <div className="watcher-list-header">
        <div className="watcher-list-title">
          <h2>Watchers</h2>
          <span className="watcher-count">{watchers.length} watcher{watchers.length !== 1 ? 's' : ''}</span>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew} className="create-button">
            <Icon name="plus" />
            New Watcher
          </Button>
        )}
      </div>

      <div className="watcher-list-content">
        <div className="watcher-grid">
          {watchers.map((watcher) => (
            <WatcherCard
              key={watcher.id}
              watcher={watcher}
              onEdit={onEdit}
              onDelete={handleDelete}
              onViewLogs={onViewLogs}
            />
          ))}
        </div>

        <div className="watcher-list-pagination">
          <Button
            variant="outline"
            onClick={handleLoadPrevious}
            disabled={page === 0}
          >
            <Icon name="arrowLeft" />
            Previous
          </Button>
          
          <span className="page-info">
            Page {page + 1}
          </span>
          
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={!watchers || watchers.length < limit}
          >
            Next
            <Icon name="arrowRight" />
          </Button>
        </div>
      </div>

      {deleteWatcher.isPending && (
        <div className="watcher-list-deleting">
          <Spinner size="small" />
          <span>Deleting watcher...</span>
        </div>
      )}
    </div>
  );
};
