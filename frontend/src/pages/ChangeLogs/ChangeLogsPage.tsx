/**
 * ChangeLogsPage - Main Change Logs page
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@components/atoms/Button/Button';
import { Icon } from '@components/atoms/Icon/Icon';
import { Spinner } from '@components/atoms/Spinner/Spinner';
import { ChangeLogFiltersComponent } from '@components/molecules/ChangeLogFilters/ChangeLogFilters';
import { ChangeLogList } from '@components/organisms/ChangeLogList/ChangeLogList';
import { ChangeLogStats } from '@components/organisms/ChangeLogStats/ChangeLogStats';
import { WatcherCard } from '@components/organisms/WatcherCard/WatcherCard';
import { ChangeLogComparator } from '@components/organisms/ChangeLogComparator/ChangeLogComparator';
import { useChangeLogs, useChangeLogStatistics, useCompareChangeLogs } from '@hooks/useChangeLogs';
import { useWatchers } from '@hooks/useWatchers';
import { ChangeLogFilters, ChangeLogListResponse, TopWatcher } from '@types/changeLog';
import './ChangeLogsPage.css';

type TabType = 'all' | 'by-watcher' | 'compare';

export const ChangeLogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [filters, setFilters] = useState<ChangeLogFilters>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showStats, setShowStats] = useState(true);

  // Data fetching
  const { data: changeLogs, isLoading: isLoadingLogs } = useChangeLogs({
    ...filters,
    skip: 0,
    limit: 50
  });

  const { data: statistics, isLoading: isLoadingStats } = useChangeLogStatistics(filters);
  const { data: watchers } = useWatchers({ limit: 100 });
  const { data: comparison, isLoading: isLoadingComparison } = useCompareChangeLogs(selectedIds);

  // Prepare watcher data for cards
  const watcherData: TopWatcher[] = watchers?.map(w => ({
    id: w.id,
    name: w.name,
    url: w.url,
    execution_mode: w.execution_mode,
    change_count: w.change_count || 0,
    last_change: w.last_changed_at
  })) || [];

  const handleFiltersChange = (newFilters: ChangeLogFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleViewDiff = (changeLog: ChangeLogListResponse) => {
    // The ChangeLogCard component handles its own diff viewing
    // This function is kept for compatibility but doesn't need to do anything
  };

  const handleViewWatcher = (watcherId: number) => {
    // Navigate to watcher details or filter by watcher
    setFilters({ ...filters, watcher_id: watcherId });
    setActiveTab('all');
  };

  const handleCompare = (ids: number[]) => {
    setSelectedIds(ids);
  };

  const tabs = [
    { id: 'all' as TabType, label: 'All', icon: 'list' },
    { id: 'by-watcher' as TabType, label: 'By Watcher', icon: 'monitor' },
    { id: 'compare' as TabType, label: 'Compare', icon: 'compare' }
  ];

  return (
    <div className="change-logs-page">
      <div className="change-logs-page-header">
        <div className="change-logs-page-title-section">
          <h1 className="change-logs-page-title">Change Logs</h1>
          <p className="change-logs-page-subtitle">
            Monitor and analyze changes in your websites and APIs
          </p>
        </div>
        
        <div className="change-logs-page-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStats(!showStats)}
            className="change-logs-page-stats-toggle"
          >
            <Icon name={showStats ? 'chevronUp' : 'chevronDown'} size="xs" />
            {showStats ? 'Hide' : 'Show'} Statistics
          </Button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && statistics && (
        <div className="change-logs-page-stats">
          <ChangeLogStats statistics={statistics} isLoading={isLoadingStats} />
        </div>
      )}

      {/* Filters */}
      <div className="change-logs-page-filters">
        <ChangeLogFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          watchers={watchers?.map(w => ({ id: w.id, name: w.name })) || []}
        />
      </div>

      {/* Tabs */}
      <div className="change-logs-page-tabs">
        <div className="change-logs-page-tab-list">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`change-logs-page-tab ${activeTab === tab.id ? 'change-logs-page-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon name={tab.icon} size="sm" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="change-logs-page-content">
        {activeTab === 'all' && (
          <ChangeLogList
            changeLogs={changeLogs || []}
            isLoading={isLoadingLogs}
            onViewWatcher={handleViewWatcher}
          />
        )}

        {activeTab === 'by-watcher' && (
          <div className="change-logs-page-watcher-grid">
            {watcherData.map(watcher => (
              <WatcherCard
                key={watcher.id}
                watcher={watchers?.find(w => w.id === watcher.id)!}
                onEdit={() => handleViewWatcher(watcher.id)}
              />
            ))}
          </div>
        )}

        {activeTab === 'compare' && (
          <ChangeLogComparator
            changeLogs={changeLogs || []}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onCompare={handleCompare}
            comparison={comparison}
            isLoading={isLoadingComparison}
          />
        )}
      </div>

      {/* Loading overlay */}
      {(isLoadingLogs || isLoadingStats) && (
        <div className="change-logs-page-loading">
          <Spinner size="lg" />
          <p>Loading data...</p>
        </div>
      )}
    </div>
  );
};
