/**
 * MonitorCreatePage Component
 * Create new monitor
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateMonitor } from '@hooks/useMonitors';
import { MonitorForm, MonitorFormData } from '@components/organisms';
import { Button } from '@components/atoms/Button/Button';
import { Icon } from '@components/atoms/Icon/Icon';
import { useModal } from '@hooks/useModal';
import { AlertModal } from '@components/molecules';
import { ROUTES } from '@constants/routes';
import './MonitorCreatePage.css';

export const MonitorCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createMonitor = useCreateMonitor();
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

      const createData = {
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

      await createMonitor.mutateAsync(createData);
      
      showAlert({
        title: 'Success',
        message: `Monitor "${data.name}" created successfully!`,
        type: 'success'
      });
      
      setTimeout(() => navigate(ROUTES.MONITORS), 1500);
    } catch (error) {
      console.error('Error creating monitor:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to create monitor',
        type: 'error'
      });
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.MONITORS);
  };

  return (
    <div className="monitor-create-page">
      <div className="monitor-create-header">
        <div>
          <h1 className="monitor-create-title">Create Monitor</h1>
          <p className="monitor-create-subtitle">
            Set up a new monitor to track website or API changes
          </p>
        </div>
        <div className="monitor-create-header-actions">
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
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createMonitor.isPending}
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