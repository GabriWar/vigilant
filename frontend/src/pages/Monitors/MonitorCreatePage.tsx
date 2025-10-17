import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateMonitor } from '@hooks/useMonitors';
import { Button } from '@components/atoms/Button/Button';
import { ROUTES } from '@constants/routes';

export const MonitorCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createMonitor = useCreateMonitor();
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    monitor_type: 'webpage' as 'webpage' | 'api',
    watch_interval: 60,
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMonitor.mutateAsync(formData);
      navigate(ROUTES.MONITORS);
    } catch (error) {
      console.error('Failed to create monitor:', error);
    }
  };

  return (
    <div>
      <h1>Create Monitor</h1>
      
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
          <Button type="submit" disabled={createMonitor.isPending}>
            {createMonitor.isPending ? 'Creating...' : 'Create Monitor'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.MONITORS)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
