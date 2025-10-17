import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@components/atoms/Button/Button';
import { Badge } from '@components/atoms/Badge/Badge';
import { Icon } from '@components/atoms/Icon/Icon';
import { Card } from '@components/atoms/Card/Card';
import { CookieStatsCard } from '@components/organisms/CookieStatsCard/CookieStatsCard';
import { ConfirmModal } from '@components/molecules/ConfirmModal/ConfirmModal';
import { cookiesApi, Cookie, CookieWithExpirationInfo, ExpiredCookieInfo } from '@services/api/cookies';
import './CookiesPage.css';

export const CookiesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'expiring' | 'expired'>('all');

  // Fetch statistics
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['cookie-statistics'],
    queryFn: cookiesApi.getStatistics,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch all cookies
  const { data: allCookies, isLoading: allLoading } = useQuery({
    queryKey: ['cookies', 'all'],
    queryFn: () => cookiesApi.getAll({ include_expired: true }),
    enabled: activeTab === 'all',
  });

  // Fetch expiring soon cookies
  const { data: expiringSoon, isLoading: expiringLoading } = useQuery({
    queryKey: ['cookies', 'expiring-soon'],
    queryFn: () => cookiesApi.getExpiringSoon(48), // 48 hours
    enabled: activeTab === 'expiring',
  });

  // Fetch expired cookies
  const { data: expired, isLoading: expiredLoading } = useQuery({
    queryKey: ['cookies', 'expired'],
    queryFn: cookiesApi.getExpired,
    enabled: activeTab === 'expired',
  });

  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: cookiesApi.cleanup,
    onSuccess: (data) => {
      alert(`Successfully cleaned up ${data.deleted_count} expired cookie(s)`);
      queryClient.invalidateQueries({ queryKey: ['cookies'] });
      queryClient.invalidateQueries({ queryKey: ['cookie-statistics'] });
      setShowCleanupModal(false);
    },
    onError: () => {
      alert('Failed to cleanup expired cookies');
    },
  });

  const formatExpirationTime = (seconds: number) => {
    if (seconds < 0) return 'Expired';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const getExpirationBadge = (seconds: number | null, isExpired: boolean) => {
    if (isExpired) return { variant: 'error' as const, text: 'Expired' };
    if (seconds === null) return { variant: 'secondary' as const, text: 'Session' };
    if (seconds < 3600) return { variant: 'error' as const, text: formatExpirationTime(seconds) };
    if (seconds < 86400) return { variant: 'warning' as const, text: formatExpirationTime(seconds) };
    return { variant: 'success' as const, text: formatExpirationTime(seconds) };
  };

  const renderCookieCard = (cookie: Cookie, expiresIn?: number | null, isExpired?: boolean) => {
    const badge = getExpirationBadge(expiresIn ?? null, isExpired ?? false);

    return (
      <Card key={cookie.id} className={`cookie-card ${isExpired ? 'expired' : ''}`}>
        <div className="cookie-card-header">
          <div className="cookie-card-title">
            <Icon name="cookie" size="sm" />
            <div className="cookie-card-name">{cookie.name}</div>
          </div>
          <Badge variant={badge.variant}>{badge.text}</Badge>
        </div>

        <div className="cookie-card-value">
          <div className="cookie-card-value-label">Value:</div>
          <div className="cookie-card-value-content">{cookie.value}</div>
        </div>

        <div className="cookie-card-details">
          {cookie.domain && (
            <div className="cookie-card-detail">
              <Icon name="globe" size="sm" />
              <span className="cookie-card-detail-label">Domain:</span>
              <span className="cookie-card-detail-value">{cookie.domain}</span>
            </div>
          )}
          {cookie.path && (
            <div className="cookie-card-detail">
              <Icon name="folder" size="sm" />
              <span className="cookie-card-detail-label">Path:</span>
              <span className="cookie-card-detail-value">{cookie.path}</span>
            </div>
          )}
          {cookie.expires ? (
            <div className="cookie-card-detail">
              <Icon name="clock" size="sm" />
              <span className="cookie-card-detail-label">Expires:</span>
              <span className="cookie-card-detail-value">{new Date(cookie.expires).toLocaleString()}</span>
            </div>
          ) : (
            <div className="cookie-card-detail">
              <Icon name="clock" size="sm" />
              <span className="cookie-card-detail-label">Type:</span>
              <span className="cookie-card-detail-value">Session Cookie (no expiration)</span>
            </div>
          )}
          <div className="cookie-card-detail">
            <Icon name="calendar" size="sm" />
            <span className="cookie-card-detail-label">Created:</span>
            <span className="cookie-card-detail-value">{new Date(cookie.created_at).toLocaleString()}</span>
          </div>
          <div className="cookie-card-detail">
            <Icon name="refresh" size="sm" />
            <span className="cookie-card-detail-label">Updated:</span>
            <span className="cookie-card-detail-value">{new Date(cookie.updated_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="cookie-card-meta">
          <span className="cookie-card-id">
            <Icon name="info" size="xs" />
            ID: {cookie.id}
          </span>
          <span className="cookie-card-request">
            <Icon name="settings" size="xs" />
            Request: {cookie.request_id}
          </span>
        </div>
      </Card>
    );
  };

  const renderContent = () => {
    if (activeTab === 'all') {
      if (allLoading) return <div className="cookies-loading"><Icon name="loader" size="lg" />Loading...</div>;
      if (!allCookies || allCookies.length === 0) return <div className="cookies-empty">No cookies found</div>;

      return (
        <div className="cookies-grid">
          {allCookies.map(cookie => {
            // Calculate expiration for display
            let expiresIn: number | null = null;
            let isExpired = false;

            if (cookie.expires) {
              const now = new Date();
              const expires = new Date(cookie.expires);
              expiresIn = Math.floor((expires.getTime() - now.getTime()) / 1000);
              isExpired = expiresIn < 0;
            }

            return renderCookieCard(cookie, expiresIn, isExpired);
          })}
        </div>
      );
    }

    if (activeTab === 'expiring') {
      if (expiringLoading) return <div className="cookies-loading"><Icon name="loader" size="lg" />Loading...</div>;
      if (!expiringSoon || expiringSoon.length === 0) {
        return <div className="cookies-empty">No cookies expiring soon</div>;
      }

      return (
        <div className="cookies-grid">
          {expiringSoon.map(item =>
            renderCookieCard(item.cookie, item.expires_in_seconds, item.is_expired)
          )}
        </div>
      );
    }

    if (activeTab === 'expired') {
      if (expiredLoading) return <div className="cookies-loading"><Icon name="loader" size="lg" />Loading...</div>;
      if (!expired || expired.length === 0) {
        return <div className="cookies-empty">No expired cookies</div>;
      }

      return (
        <div className="cookies-grid">
          {expired.map(item =>
            renderCookieCard(item.cookie, -item.expired_since_seconds, true)
          )}
        </div>
      );
    }
  };

  return (
    <div className="cookies-page">
      <div className="cookies-header">
        <div>
          <h1 className="cookies-title">Cookie Management</h1>
          <p className="cookies-subtitle">
            Manage authentication cookies and monitor expiration
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="cookies-stats-section">
          <CookieStatsCard statistics={statistics || { total: 0, valid: 0, expired: 0, expiring_soon_24h: 0, session: 0 }} isLoading={statsLoading} />
        </div>

        {/* Actions */}
        <div className="cookies-actions">
          <div className="cookies-tabs">
            <button
              className={`cookies-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <Icon name="database" size="sm" />
              All Cookies
              {statistics && <Badge variant="secondary">{statistics.total}</Badge>}
            </button>
            <button
              className={`cookies-tab ${activeTab === 'expiring' ? 'active' : ''}`}
              onClick={() => setActiveTab('expiring')}
            >
              <Icon name="alert-circle" size="sm" />
              Expiring Soon
              {statistics && statistics.expiring_soon_24h > 0 && (
                <Badge variant="warning">{statistics.expiring_soon_24h}</Badge>
              )}
            </button>
            <button
              className={`cookies-tab ${activeTab === 'expired' ? 'active' : ''}`}
              onClick={() => setActiveTab('expired')}
            >
              <Icon name="x-circle" size="sm" />
              Expired
              {statistics && statistics.expired > 0 && (
                <Badge variant="error">{statistics.expired}</Badge>
              )}
            </button>
          </div>

          <div className="cookies-actions-buttons">
            {statistics && statistics.expired > 0 && (
              <Button
                variant="secondary"
                onClick={() => setShowCleanupModal(true)}
              >
                <Icon name="trash" size="sm" />
                Cleanup Expired ({statistics.expired})
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="cookies-content">
          {renderContent()}
        </div>

        {/* Cleanup Confirmation Modal */}
        <ConfirmModal
          isOpen={showCleanupModal}
          onClose={() => setShowCleanupModal(false)}
          onConfirm={() => cleanupMutation.mutate()}
          title="Cleanup Expired Cookies"
          message={`Are you sure you want to delete ${statistics?.expired || 0} expired cookie(s)? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
  );
};
