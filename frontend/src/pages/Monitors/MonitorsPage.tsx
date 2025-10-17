import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMonitors, useDeleteMonitor, useTestRequest } from '@hooks/useMonitors';
import { useLogs } from '@hooks/useLogs';
import { Button } from '@components/atoms/Button/Button';
import { SearchBar } from '@components/molecules/SearchBar/SearchBar';
import { FilterBar, FilterOption } from '@components/molecules/FilterBar/FilterBar';
import { MonitorCard } from '@components/organisms/MonitorCard/MonitorCard';
import { Spinner } from '@components/atoms/Spinner/Spinner';
import { Card } from '@components/atoms/Card/Card';
import { Icon } from '@components/atoms/Icon/Icon';
import { AlertModal, ConfirmModal, TestResultModal } from '@components/molecules';
import { useModal } from '@hooks/useModal';
import { ROUTES } from '@constants/routes';
import './MonitorsPage.css';

export const MonitorsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: monitors, isLoading, error, refetch } = useMonitors();
  const { refetch: refetchLogs } = useLogs();
  const deleteMonitor = useDeleteMonitor();
  const testRequest = useTestRequest();
  const { showAlert, showConfirm, hideAlert, hideConfirm, handleConfirm, alertModal, confirmModal } = useModal();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [refetchingMonitors, setRefetchingMonitors] = useState<Set<number>>(new Set());
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);

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

  const handleTestRequest = async (monitor: any) => {
    setIsTestLoading(true);
    setIsTestModalOpen(true);
    
    try {
      const result = await testRequest.mutateAsync({
        url: monitor.url,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
        }
      });

      // Format the result for the modal
      const formattedResult = {
        status: result.status,
        statusText: result.statusText,
        headers: result.headers,
        body: result.body,
        cookies: result.cookies,
        requestData: {
          url: monitor.url,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
          }
        },
        responseTime: result.headers['x-response-time'] ? parseInt(result.headers['x-response-time']) : undefined
      };

      setTestResult(formattedResult);
      
      // Invalidate logs to refresh them with new data (only for testing)
      refetchLogs();
    } catch (error: any) {
      console.error('Error testing request:', error);
      setTestResult({
        error: error.response?.data?.detail || 'Failed to test request',
        errorDetails: {
          code: error.response?.status?.toString(),
          message: error.message,
          details: error.response?.data
        },
        requestData: {
          url: monitor.url,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
          }
        }
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  const handleForceRequest = async (monitor: any) => {
    setRefetchingMonitors(prev => new Set(prev).add(monitor.id));
    
    try {
      // Force a request without testing - just execute the monitor
      await testRequest.mutateAsync({
        url: monitor.url,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
        }
      });
      
      // Refetch all monitors to get updated data
      await refetch();
      
      // Show success message
      showAlert({
        title: 'Request Executed',
        message: `Monitor "${monitor.name}" request has been executed successfully.`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error executing request:', error);
      showAlert({
        title: 'Request Failed',
        message: 'Failed to execute monitor request.',
        type: 'error'
      });
    } finally {
      setRefetchingMonitors(prev => {
        const newSet = new Set(prev);
        newSet.delete(monitor.id);
        return newSet;
      });
    }
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
        <div className="monitors-header-actions">
          <Button
            variant="secondary"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <Icon name="refresh" size="sm" />
            Refresh All
          </Button>
          <Link to={ROUTES.MONITOR_CREATE}>
            <Button>
              <Icon name="plus" size="sm" />
              Create Monitor
            </Button>
          </Link>
        </div>
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
                onRefetch={handleForceRequest}
                isRefetching={refetchingMonitors.has(monitor.id)}
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

      <TestResultModal
        isOpen={isTestModalOpen}
        onClose={() => {
          setIsTestModalOpen(false);
          setTestResult(null);
        }}
        result={testResult}
        isLoading={isTestLoading}
      />
    </div>
  );
};
