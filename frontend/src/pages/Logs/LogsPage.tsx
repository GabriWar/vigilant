/**
 * LogsPage Component
 * Displays change logs with advanced search and filtering
 */

import React, { useState, useMemo } from 'react';
import { SearchBar } from '@components/molecules/SearchBar/SearchBar';
import { FilterBar, FilterOption } from '@components/molecules/FilterBar/FilterBar';
import { LogViewer, ChangeLog } from '@components/organisms/LogViewer/LogViewer';
import { DiffViewer } from '@components/organisms/DiffViewer/DiffViewer';
import { Spinner } from '@components/atoms/Spinner/Spinner';
import { Icon } from '@components/atoms/Icon/Icon';
import { AlertModal } from '@components/molecules';
import { useModal } from '@hooks/useModal';
import './LogsPage.css';

export const LogsPage: React.FC = () => {
  // Mock data - replace with actual API call
  const [isLoading] = useState(false);
  const { showAlert, hideAlert, alertModal } = useModal();
  const [logs] = useState<ChangeLog[]>([
    {
      id: 1,
      monitor_id: 1,
      monitor_name: 'My Website',
      change_type: 'content_changed',
      old_size: 1024,
      new_size: 1536,
      detected_at: new Date().toISOString(),
      diff: '- Old content line\n+ New content line',
    },
    {
      id: 2,
      monitor_id: 2,
      monitor_name: 'API Endpoint',
      change_type: 'size_changed',
      old_size: 2048,
      new_size: 1800,
      detected_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [changeTypeFilter, setChangeTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        (log.monitor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        log.change_type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        changeTypeFilter === 'all' || log.change_type === changeTypeFilter;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const logDate = new Date(log.detected_at);
        const now = new Date();
        const dayInMs = 86400000;

        switch (dateFilter) {
          case 'today':
            matchesDate = logDate.toDateString() === now.toDateString();
            break;
          case 'week':
            matchesDate = now.getTime() - logDate.getTime() <= 7 * dayInMs;
            break;
          case 'month':
            matchesDate = now.getTime() - logDate.getTime() <= 30 * dayInMs;
            break;
        }
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [logs, searchQuery, changeTypeFilter, dateFilter]);

  const changeTypeOptions: FilterOption[] = [
    { label: 'All Changes', value: 'all' },
    { label: 'Content Changed', value: 'content_changed' },
    { label: 'Size Changed', value: 'size_changed' },
    { label: 'New Content', value: 'new_content' },
  ];

  const dateOptions: FilterOption[] = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
  ];

  const handleResetFilters = () => {
    setSearchQuery('');
    setChangeTypeFilter('all');
    setDateFilter('all');
  };

  const [selectedDiffLog, setSelectedDiffLog] = useState<ChangeLog | null>(null);

  const handleViewDiff = (log: ChangeLog) => {
    setSelectedDiffLog(log);
  };

  const handleCloseDiff = () => {
    setSelectedDiffLog(null);
  };

  const handleDownloadArchive = async (log: ChangeLog) => {
    try {
      const response = await fetch(`http://localhost:8000/api/change-logs/${log.id}/download`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `change_log_${log.id}_archive.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading archive:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to download archive',
        type: 'error'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="logs-loading">
        <Spinner size="xl" />
        <p>Loading change logs...</p>
      </div>
    );
  }

  return (
    <div className="logs-page">
      <div className="logs-header">
        <div>
          <h1 className="logs-title">Change Logs</h1>
          <p className="logs-subtitle">
            View and analyze all detected changes across your monitors
          </p>
        </div>
      </div>

      <div className="logs-controls">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by monitor name or change type..."
          fullWidth
        />

        <FilterBar
          filters={[
            {
              label: 'Change Type',
              options: changeTypeOptions,
              value: changeTypeFilter,
              onChange: setChangeTypeFilter,
            },
            {
              label: 'Date',
              options: dateOptions,
              value: dateFilter,
              onChange: setDateFilter,
            },
          ]}
          onReset={handleResetFilters}
        />
      </div>

      <div className="logs-content">
        <div className="logs-results-count">
          <Icon name="filter" size="sm" />
          <span>
            Showing {filteredLogs.length} of {logs.length} change logs
          </span>
        </div>

        <LogViewer
          logs={filteredLogs}
          onViewDiff={handleViewDiff}
          onDownloadArchive={handleDownloadArchive}
        />
      </div>

      {selectedDiffLog && selectedDiffLog.diff && (
        <DiffViewer
          isOpen={!!selectedDiffLog}
          onClose={handleCloseDiff}
          diff={selectedDiffLog.diff}
          title={`Changes in ${selectedDiffLog.monitor_name || `Monitor #${selectedDiffLog.monitor_id}`}`}
          oldSize={selectedDiffLog.old_size}
          newSize={selectedDiffLog.new_size}
        />
      )}

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        title={alertModal.options.title}
        message={alertModal.options.message}
        type={alertModal.options.type}
        confirmText={alertModal.options.confirmText}
      />
    </div>
  );
};
