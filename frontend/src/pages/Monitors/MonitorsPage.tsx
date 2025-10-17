import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMonitors, useDeleteMonitor } from '@hooks/useMonitors';
import { Button } from '@components/atoms/Button/Button';
import { SearchBar } from '@components/molecules/SearchBar/SearchBar';
import { FilterBar, FilterOption } from '@components/molecules/FilterBar/FilterBar';
import { MonitorCard } from '@components/organisms/MonitorCard/MonitorCard';
import { Spinner } from '@components/atoms/Spinner/Spinner';
import { Card } from '@components/atoms/Card/Card';
import { Icon } from '@components/atoms/Icon/Icon';
import { AlertModal, ConfirmModal } from '@components/molecules';
import { useModal } from '@hooks/useModal';
import { ROUTES } from '@constants/routes';
import './MonitorsPage.css';

export const MonitorsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: monitors, isLoading, error } = useMonitors();
  const deleteMonitor = useDeleteMonitor();
  const { showAlert, showConfirm, hideAlert, hideConfirm, handleConfirm, alertModal, confirmModal } = useModal();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const handleEdit = (monitor: any) => {
    navigate(`/monitors/${monitor.id}/edit`);
  };

  const handleDelete = async (monitor: any) => {
    showConfirm(
      {
        title: 'Delete Monitor',
        message: `Are you sure you want to delete "${monitor.name}"? This action cannot be undone.`,
        type: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      },
      async () => {
        try {
          await deleteMonitor.mutateAsync(monitor.id);
        } catch (error) {
          console.error('Error deleting monitor:', error);
          showAlert({
            title: 'Error',
            message: 'Failed to delete monitor',
            type: 'error'
          });
        }
      }
    );
  };

  const filteredMonitors = useMemo(() => {
    if (!monitors) return [];

    return monitors.filter((monitor) => {
      const matchesSearch =
        monitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        monitor.url.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && monitor.is_active) ||
        (statusFilter === 'inactive' && !monitor.is_active);

      const matchesType =
        typeFilter === 'all' || monitor.monitor_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [monitors, searchQuery, statusFilter, typeFilter]);

  const statusOptions: FilterOption[] = [
    { label: 'All Status', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  const typeOptions: FilterOption[] = [
    { label: 'All Types', value: 'all' },
    { label: 'Webpage', value: 'webpage' },
    { label: 'API', value: 'api' },
  ];

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  if (isLoading) {
    return (
      <div className="monitors-loading">
        <Spinner size="xl" />
        <p>Loading monitors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="monitors-error">
        <Icon name="exclamation" size="lg" />
        <p>Error loading monitors</p>
      </div>
    );
  }

  return (
    <div className="monitors-page">
      <div className="monitors-header">
        <div>
          <h1 className="monitors-title">Monitors</h1>
          <p className="monitors-subtitle">
            Manage and track all your website and API monitors
          </p>
        </div>
        <Link to={ROUTES.MONITOR_CREATE}>
          <Button>
            <Icon name="plus" size="sm" />
            Create Monitor
          </Button>
        </Link>
      </div>

      <div className="monitors-controls">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search monitors by name or URL..."
          fullWidth
        />

        <FilterBar
          filters={[
            {
              label: 'Status',
              options: statusOptions,
              value: statusFilter,
              onChange: setStatusFilter,
            },
            {
              label: 'Type',
              options: typeOptions,
              value: typeFilter,
              onChange: setTypeFilter,
            },
          ]}
          onReset={handleResetFilters}
        />
      </div>

      <div className="monitors-content">
        {filteredMonitors.length > 0 ? (
          <div className="monitors-grid">
            {filteredMonitors.map((monitor) => (
              <MonitorCard
                key={monitor.id}
                monitor={monitor}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <Card padding="lg" className="monitors-empty">
            <Icon name="monitor" size="xl" />
            <h3>No monitors found</h3>
            <p>
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first monitor to get started!'}
            </p>
            <Link to={ROUTES.MONITOR_CREATE}>
              <Button>
                <Icon name="plus" size="sm" />
                Create Monitor
              </Button>
            </Link>
          </Card>
        )}
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        title={alertModal.options.title}
        message={alertModal.options.message}
        type={alertModal.options.type}
        confirmText={alertModal.options.confirmText}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={hideConfirm}
        onConfirm={handleConfirm}
        title={confirmModal.options.title}
        message={confirmModal.options.message}
        type={confirmModal.options.type}
        confirmText={confirmModal.options.confirmText}
        cancelText={confirmModal.options.cancelText}
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
};
