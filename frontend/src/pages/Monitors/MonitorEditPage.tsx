/**
 * MonitorEditPage Component
 * Edit existing monitor
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMonitor, useUpdateMonitor } from '@hooks/useMonitors';
import { Button } from '@components/atoms/Button/Button';
import { Spinner } from '@components/atoms/Spinner/Spinner';
import { Card } from '@components/atoms/Card/Card';
import { Icon } from '@components/atoms/Icon/Icon';
import { AlertModal } from '@components/molecules';
import { useModal } from '@hooks/useModal';
import { ROUTES } from '@constants/routes';

export const MonitorEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: monitor, isLoading, error } = useMonitor(parseInt(id!));
  const updateMonitor = useUpdateMonitor();
  const { showAlert, hideAlert, alertModal } = useModal();

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    monitor_type: 'webpage' as 'webpage' | 'api',
    watch_interval: 60,
    is_active: true,
  });

  useEffect(() => {
    if (monitor) {
      setFormData({
        name: monitor.name,
        url: monitor.url,
        monitor_type: monitor.monitor_type,
        watch_interval: monitor.watch_interval,
        is_active: monitor.is_active,
      });
    }
  }, [monitor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMonitor.mutateAsync({
        id: parseInt(id!),
        data: formData,
      });
      navigate(ROUTES.MONITORS);
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
    navigate('/monitors');
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <Spinner size="xl" />
      </div>
    );
  }

  if (error || !monitor) {
    return (
      <Card padding="lg" style={{ margin: '2rem auto', maxWidth: '600px', textAlign: 'center' }}>
        <Icon name="exclamation" size="lg" />
        <h2>Monitor not found</h2>
        <p>The monitor you're looking for doesn't exist.</p>
      </Card>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Edit Monitor</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: '600px', marginTop: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>URL</label>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Type</label>
          <select
            value={formData.monitor_type}
            onChange={(e) => setFormData({ ...formData, monitor_type: e.target.value as 'webpage' | 'api' })}
            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
          >
            <option value="webpage">Webpage</option>
            <option value="api">API</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Watch Interval (seconds)</label>
          <input
            type="number"
            value={formData.watch_interval}
            onChange={(e) => setFormData({ ...formData, watch_interval: parseInt(e.target.value) })}
            min="1"
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
          />
        </div>

        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          <label>Active</label>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button type="submit" disabled={updateMonitor.isPending}>
            {updateMonitor.isPending ? 'Updating...' : 'Update Monitor'}
          </Button>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </form>

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
