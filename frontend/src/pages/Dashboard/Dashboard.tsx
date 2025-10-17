import React from 'react';
import { useMonitors } from '@hooks/useMonitors';
import { useNotifications } from '@hooks/useNotifications';
import { StatsCard } from '@components/organisms/StatsCard/StatsCard';
import { MonitorCard } from '@components/organisms/MonitorCard/MonitorCard';
import { Spinner } from '@components/atoms/Spinner/Spinner';
import { Card } from '@components/atoms/Card/Card';
import { Button } from '@components/atoms/Button/Button';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { data: monitors, isLoading, error } = useMonitors({ limit: 10 });
  const { testPing, testCookie } = useNotifications();

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <Spinner size="xl" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>Error loading monitors</p>
      </div>
    );
  }

  const activeMonitors = monitors?.filter(m => m.is_active).length || 0;
  const totalChecks = monitors?.reduce((sum, m) => sum + (m.check_count || 0), 0) || 0;
  const totalChanges = monitors?.reduce((sum, m) => sum + (m.change_count || 0), 0) || 0;
  const recentChanges = monitors?.filter(m => m.last_changed_at).length || 0;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Monitor your websites and APIs in real-time</p>
        
        {/* Test buttons */}
        <div className="dashboard-test-buttons">
          <Button 
            variant="primary" 
            size="sm" 
            onClick={testPing}
            className="test-button"
          >
            Test Ping 🚀
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={testCookie}
            className="test-button"
          >
            Test Cookie 🍪
          </Button>
        </div>
      </div>

      <div className="dashboard-stats">
        <StatsCard
          title="Total Monitors"
          value={monitors?.length || 0}
          icon="monitor"
          color="primary"
        />
        <StatsCard
          title="Active Monitors"
          value={activeMonitors}
          icon="eye"
          color="success"
        />
        <StatsCard
          title="Total Checks"
          value={totalChecks}
          icon="chart"
          color="primary"
        />
        <StatsCard
          title="Recent Changes"
          value={recentChanges}
          icon="exclamation"
          color="warning"
        />
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2 className="dashboard-section-title">Recent Monitors</h2>
          {monitors && monitors.length > 0 ? (
            <div className="dashboard-monitors">
              {monitors.slice(0, 6).map((monitor) => (
                <MonitorCard key={monitor.id} monitor={monitor} />
              ))}
            </div>
          ) : (
            <Card padding="lg" className="dashboard-empty">
              <p>No monitors found. Create one to get started!</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
