import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Watcher, ExecutionMode, ContentType } from '@/types/watcher';
import { WatcherFormData } from '@/components/organisms/WatcherForm';
import { WatcherList } from '@/components/organisms/WatcherList';
import { WatcherForm } from '@/components/organisms/WatcherForm';
import { Modal } from '@components/atoms/Modal/Modal';
import { Button } from '@components/atoms/Button/Button';
import { Icon } from '@components/atoms/Icon/Icon';
import { Input } from '@components/atoms/Input/Input';
import { useCreateWatcher, useUpdateWatcher, useWatchers } from '@/hooks/useWatchers';
import { useToast } from '@/hooks/useToast';
import './WatchersPage.css';

export const WatchersPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWatcher, setEditingWatcher] = useState<Watcher | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    execution_mode: '',
    content_type: '',
    is_active: undefined as boolean | undefined
  });

  const createWatcher = useCreateWatcher();
  const updateWatcher = useUpdateWatcher();
  const { data: watchers, isLoading } = useWatchers(filters);

  const handleCreateWatcher = async (data: WatcherFormData) => {
    try {
      // Convert headers from string to object
      const processedData = {
        ...data,
        headers: data.headers ? JSON.parse(data.headers) : {}
      };
      await createWatcher.mutateAsync(processedData);
      setShowCreateModal(false);
      showToast('Watcher created successfully!', 'success');
    } catch (error) {
      showToast('Failed to create watcher: ' + (error as Error).message, 'error');
    }
  };

  const handleUpdateWatcher = async (data: WatcherFormData) => {
    if (!editingWatcher) return;
    
    try {
      // Convert headers from string to object
      const processedData = {
        ...data,
        headers: data.headers ? JSON.parse(data.headers) : {}
      };
      await updateWatcher.mutateAsync({ id: editingWatcher.id, data: processedData });
      setEditingWatcher(null);
      showToast('Watcher updated successfully!', 'success');
    } catch (error) {
      showToast('Failed to update watcher: ' + (error as Error).message, 'error');
    }
  };

  const handleEditWatcher = (watcher: Watcher) => {
    setEditingWatcher(watcher);
  };

  const handleViewLogs = (watcher: Watcher) => {
    navigate(`/change-logs?watcher_id=${watcher.id}`);
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      execution_mode: '',
      content_type: '',
      is_active: undefined
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== undefined
  );

  return (
    <div className="watchers-page">
      <div className="watchers-page-header">
        <div className="page-title">
          <h1>Watchers</h1>
          <p>Monitor websites and APIs for changes</p>
        </div>
        
        <Button
          onClick={() => setShowCreateModal(true)}
          className="create-button"
        >
          <Icon name="plus" />
          New Watcher
        </Button>
      </div>

      {/* Filters */}
      <div className="watchers-filters">
        <div className="filters-row">
          <div className="filter-group">
            <Input
              type="text"
              placeholder="Search watchers..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <select
              value={filters.execution_mode}
              onChange={(e) => handleFilterChange('execution_mode', e.target.value)}
              className="filter-select"
            >
              <option value="">All Execution Modes</option>
              <option value={ExecutionMode.SCHEDULED}>Scheduled</option>
              <option value={ExecutionMode.MANUAL}>Manual</option>
              <option value={ExecutionMode.BOTH}>Both</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filters.content_type}
              onChange={(e) => handleFilterChange('content_type', e.target.value)}
              className="filter-select"
            >
              <option value="">All Content Types</option>
              <option value={ContentType.AUTO}>Auto Detect</option>
              <option value={ContentType.TEXT}>Text</option>
              <option value={ContentType.JSON}>JSON</option>
              <option value={ContentType.HTML}>HTML</option>
              <option value={ContentType.XML}>XML</option>
              <option value={ContentType.IMAGE}>Image</option>
              <option value={ContentType.PDF}>PDF</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filters.is_active === undefined ? '' : filters.is_active.toString()}
              onChange={(e) => handleFilterChange('is_active', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="clear-filters-button"
            >
              <Icon name="x" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Watchers List */}
      <div className="watchers-content">
        <WatcherList
          filters={filters}
          onEdit={handleEditWatcher}
          onViewLogs={handleViewLogs}
          onCreateNew={() => setShowCreateModal(true)}
        />
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Watcher"
        size="large"
      >
        <WatcherForm
          onSubmit={handleCreateWatcher}
          onCancel={() => setShowCreateModal(false)}
          isLoading={createWatcher.isPending}
          mode="create"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingWatcher}
        onClose={() => setEditingWatcher(null)}
        title="Edit Watcher"
        size="large"
      >
        {editingWatcher && (
          <WatcherForm
            initialData={{
              name: editingWatcher.name,
              url: editingWatcher.url,
              method: editingWatcher.method,
              headers: JSON.stringify(editingWatcher.headers || {}, null, 2),
              body: editingWatcher.body || '',
              content_type: editingWatcher.content_type,
              execution_mode: editingWatcher.execution_mode,
              watch_interval: editingWatcher.watch_interval,
              is_active: editingWatcher.is_active,
              save_cookies: editingWatcher.save_cookies,
              use_cookies: editingWatcher.use_cookies,
              cookie_watcher_id: editingWatcher.cookie_watcher_id,
              comparison_mode: editingWatcher.comparison_mode
            }}
            onSubmit={handleUpdateWatcher}
            onCancel={() => setEditingWatcher(null)}
            isLoading={updateWatcher.isPending}
            mode="edit"
          />
        )}
      </Modal>
    </div>
  );
};
