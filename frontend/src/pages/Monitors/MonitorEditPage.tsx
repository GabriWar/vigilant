/**
 * MonitorEditPage Component
 * Edit existing monitor
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMonitor, useUpdateMonitor } from '@hooks/useMonitors';
import { MonitorForm, MonitorFormData } from '@components/organisms';
import { Button } from '@components/atoms/Button/Button';
import { Spinner } from '@components/atoms/Spinner/Spinner';
import { Card } from '@components/atoms/Card/Card';
import { Icon } from '@components/atoms/Icon/Icon';
import { AlertModal } from '@components/molecules';
import { useModal } from '@hooks/useModal';
import { ROUTES } from '@constants/routes';
import './MonitorEditPage.css';

export const MonitorEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: monitor, isLoading, error } = useMonitor(parseInt(id!));
  const updateMonitor = useUpdateMonitor();
  const { showAlert, hideAlert, alertModal } = useModal();

  const handleSubmit = async (data: MonitorFormData) => {
    try {
      // Parse headers if provided
      let headers = {};
      if (data.headers && data.headers.trim()) {
        try {
          headers = JSON.parse(data.headers);
        } catch (e) {
          showAlert({
            title: 'Error',
            message: 'Headers must be valid JSON',
            type: 'error'
          });
          return;
        }
      }

      const updateData = {
        name: data.name,
        url: data.url,
        monitor_type: data.monitor_type,
        watch_interval: data.watch_interval,
        is_active: data.is_active,
        // Include additional fields
        method: data.method || 'GET',
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        body: data.body || undefined,
        save_cookies: data.save_cookies || false,
        use_cookies: data.use_cookies || false,
        cookie_request_id: data.cookie_request_id,
      };

      await updateMonitor.mutateAsync({
        id: parseInt(id!),
        data: updateData,
      });
      
      showAlert({
        title: 'Success',
        message: `Monitor "${data.name}" updated successfully!`,
        type: 'success'
      });
      
      setTimeout(() => navigate(ROUTES.MONITORS), 1500);
    } catch (error) {
      console.error('Error updating monitor:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to update monitor',
        type: 'error'
      });
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.MONITORS);
  };

  if (isLoading) {
    return (
      <div className="monitor-edit-loading">
        <Spinner size="xl" />
        <p>Loading monitor...</p>
      </div>
    );
  }

  if (error || !monitor) {
    return (
      <div className="monitor-edit-error">
        <Card padding="lg">
          <div style={{ textAlign: 'center' }}>
            <Icon name="alert-circle" size="xl" />
            <h2>Monitor not found</h2>
            <p>The monitor you're looking for doesn't exist or has been deleted.</p>
            <Button onClick={() => navigate(ROUTES.MONITORS)}>
              Back to Monitors
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Prepare initial data for the form
  const initialData: Partial<MonitorFormData> = {
    name: monitor.name,
    url: monitor.url,
    monitor_type: monitor.monitor_type,
    method: monitor.method || 'GET',
    headers: monitor.headers ? JSON.stringify(monitor.headers, null, 2) : '{\n  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"\n}',
    body: monitor.body || '',
    save_cookies: monitor.save_cookies || false,
    use_cookies: monitor.use_cookies || false,
    cookie_request_id: monitor.cookie_request_id,
    watch_interval: monitor.watch_interval,
    is_active: monitor.is_active,
  };

  return (
    <div className="monitor-edit-page">
      <div className="monitor-edit-header">
        <div>
          <h1 className="monitor-edit-title">Edit Monitor</h1>
          <p className="monitor-edit-subtitle">
            Update monitor configuration and settings
          </p>
        </div>
        <div className="monitor-edit-header-actions">
          <Button
            variant="secondary"
            onClick={handleCancel}
          >
            <Icon name="arrow-left" size="sm" />
            Back to Monitors
          </Button>
        </div>
      </div>

      <MonitorForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateMonitor.isPending}
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        title={alertModal.options.title}
        message={alertModal.options.message}
        type={alertModal.options.type}
      />
    </div>
  );
};