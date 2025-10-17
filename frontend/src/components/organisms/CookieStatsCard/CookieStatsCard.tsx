import React from 'react';
import { Card } from '@components/atoms/Card/Card';
import { Badge } from '@components/atoms/Badge/Badge';
import { Icon } from '@components/atoms/Icon/Icon';
import './CookieStatsCard.css';

interface CookieStatistics {
  total: number;
  valid: number;
  expired: number;
  expiring_soon_24h: number;
  session: number;
}

interface CookieStatsCardProps {
  statistics: CookieStatistics;
  isLoading?: boolean;
}

export const CookieStatsCard: React.FC<CookieStatsCardProps> = ({
  statistics,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <div className="cookie-stats-loading">
          <Icon name="loader" size="lg" />
          <p>Loading statistics...</p>
        </div>
      </Card>
    );
  }

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  return (
    <Card>
      <div className="cookie-stats-card">
        <div className="cookie-stats-header">
          <h3 className="cookie-stats-title">
            <Icon name="cookie" size="md" />
            Cookie Statistics
          </h3>
        </div>

        <div className="cookie-stats-grid">
          {/* Total Cookies */}
          <div className="cookie-stat-item cookie-stat-total">
            <div className="cookie-stat-icon">
              <Icon name="database" size="lg" />
            </div>
            <div className="cookie-stat-info">
              <div className="cookie-stat-label">Total Cookies</div>
              <div className="cookie-stat-value">{statistics.total}</div>
            </div>
          </div>

          {/* Valid Cookies */}
          <div className="cookie-stat-item cookie-stat-valid">
            <div className="cookie-stat-icon">
              <Icon name="check-circle" size="lg" />
            </div>
            <div className="cookie-stat-info">
              <div className="cookie-stat-label">Valid</div>
              <div className="cookie-stat-value">
                {statistics.valid}
                <Badge variant="success" className="cookie-stat-badge">
                  {getPercentage(statistics.valid, statistics.total)}%
                </Badge>
              </div>
            </div>
          </div>

          {/* Expired Cookies */}
          <div className="cookie-stat-item cookie-stat-expired">
            <div className="cookie-stat-icon">
              <Icon name="x-circle" size="lg" />
            </div>
            <div className="cookie-stat-info">
              <div className="cookie-stat-label">Expired</div>
              <div className="cookie-stat-value">
                {statistics.expired}
                {statistics.expired > 0 && (
                  <Badge variant="error" className="cookie-stat-badge">
                    {getPercentage(statistics.expired, statistics.total)}%
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Expiring Soon */}
          <div className="cookie-stat-item cookie-stat-expiring">
            <div className="cookie-stat-icon">
              <Icon name="alert-circle" size="lg" />
            </div>
            <div className="cookie-stat-info">
              <div className="cookie-stat-label">Expiring Soon (24h)</div>
              <div className="cookie-stat-value">
                {statistics.expiring_soon_24h}
                {statistics.expiring_soon_24h > 0 && (
                  <Badge variant="warning" className="cookie-stat-badge">
                    {getPercentage(statistics.expiring_soon_24h, statistics.total)}%
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Session Cookies */}
          <div className="cookie-stat-item cookie-stat-session">
            <div className="cookie-stat-icon">
              <Icon name="clock" size="lg" />
            </div>
            <div className="cookie-stat-info">
              <div className="cookie-stat-label">Session</div>
              <div className="cookie-stat-value">
                {statistics.session}
                <Badge variant="secondary" className="cookie-stat-badge">
                  {getPercentage(statistics.session, statistics.total)}%
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Bar */}
        {statistics.total > 0 && (
          <div className="cookie-stats-summary">
            <div className="cookie-stats-bar">
              <div
                className="cookie-stats-bar-segment cookie-stats-bar-valid"
                style={{ width: `${getPercentage(statistics.valid, statistics.total)}%` }}
                title={`Valid: ${statistics.valid} (${getPercentage(statistics.valid, statistics.total)}%)`}
              />
              <div
                className="cookie-stats-bar-segment cookie-stats-bar-expiring"
                style={{ width: `${getPercentage(statistics.expiring_soon_24h, statistics.total)}%` }}
                title={`Expiring Soon: ${statistics.expiring_soon_24h} (${getPercentage(statistics.expiring_soon_24h, statistics.total)}%)`}
              />
              <div
                className="cookie-stats-bar-segment cookie-stats-bar-expired"
                style={{ width: `${getPercentage(statistics.expired, statistics.total)}%` }}
                title={`Expired: ${statistics.expired} (${getPercentage(statistics.expired, statistics.total)}%)`}
              />
              <div
                className="cookie-stats-bar-segment cookie-stats-bar-session"
                style={{ width: `${getPercentage(statistics.session, statistics.total)}%` }}
                title={`Session: ${statistics.session} (${getPercentage(statistics.session, statistics.total)}%)`}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
