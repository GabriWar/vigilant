/**
 * ChangeLogStats Organism Component
 * Statistics panel with charts
 */
import React from 'react';
import { Card } from '@components/atoms/Card/Card';
import { Chart } from '@components/atoms/Chart/Chart';
import { StatsCard } from '../StatsCard/StatsCard';
import { ChangeLogStatistics, ChartConfig, ChartSeries } from '@types/changeLog';
import './ChangeLogStats.css';

export interface ChangeLogStatsProps {
  statistics: ChangeLogStatistics;
  isLoading?: boolean;
  className?: string;
}

export const ChangeLogStats: React.FC<ChangeLogStatsProps> = ({
  statistics,
  isLoading = false,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`change-log-stats ${className}`}>
        <div className="change-log-stats-loading">
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  // Prepare frequency chart data
  const frequencyChartConfig: ChartConfig = {
    type: 'line',
    title: 'Change Frequency',
    height: 200
  };

  const frequencySeries: ChartSeries[] = [
    {
      name: 'Total',
      data: statistics.frequency_data.map(point => ({
        x: point.date,
        y: point.count
      })),
      color: '#3b82f6'
    },
    {
      name: 'New',
      data: statistics.frequency_data.map(point => ({
        x: point.date,
        y: point.new_count
      })),
      color: '#10b981'
    },
    {
      name: 'Modified',
      data: statistics.frequency_data.map(point => ({
        x: point.date,
        y: point.modified_count
      })),
      color: '#f59e0b'
    },
    {
      name: 'Errors',
      data: statistics.frequency_data.map(point => ({
        x: point.date,
        y: point.error_count
      })),
      color: '#ef4444'
    }
  ];

  // Prepare distribution chart data
  const distributionChartConfig: ChartConfig = {
    type: 'pie',
    title: 'Distribution by Type',
    height: 200
  };

  const distributionSeries: ChartSeries[] = [
    {
      name: 'New',
      data: [{ x: 'New', y: statistics.new_changes }],
      color: '#10b981'
    },
    {
      name: 'Modified',
      data: [{ x: 'Modified', y: statistics.modified_changes }],
      color: '#f59e0b'
    },
    {
      name: 'Errors',
      data: [{ x: 'Errors', y: statistics.error_changes }],
      color: '#ef4444'
    }
  ];

  return (
    <div className={`change-log-stats ${className}`}>
      <div className="change-log-stats-header">
        <h3 className="change-log-stats-title">Statistics</h3>
      </div>

      <div className="change-log-stats-cards">
        <StatsCard
          title="Total Changes"
          value={statistics.total_changes}
          icon="chart"
          color="primary"
        />
        <StatsCard
          title="New"
          value={statistics.new_changes}
          icon="plus"
          color="success"
        />
        <StatsCard
          title="Modified"
          value={statistics.modified_changes}
          icon="edit"
          color="warning"
        />
        <StatsCard
          title="Errors"
          value={statistics.error_changes}
          icon="alert"
          color="error"
        />
      </div>

      <div className="change-log-stats-charts">
        <div className="change-log-stats-chart">
          <Chart config={frequencyChartConfig} series={frequencySeries} />
        </div>
        <div className="change-log-stats-chart">
          <Chart config={distributionChartConfig} series={distributionSeries} />
        </div>
      </div>

      <div className="change-log-stats-details">
        <div className="change-log-stats-detail-section">
          <h4 className="change-log-stats-detail-title">Change Sizes</h4>
          <div className="change-log-stats-detail-grid">
            <div className="change-log-stats-detail-item">
              <span className="change-log-stats-detail-label">Average:</span>
              <span className="change-log-stats-detail-value">
                {Math.round(statistics.avg_change_size)} bytes
              </span>
            </div>
            <div className="change-log-stats-detail-item">
              <span className="change-log-stats-detail-label">Minimum:</span>
              <span className="change-log-stats-detail-value">
                {statistics.min_change_size} bytes
              </span>
            </div>
            <div className="change-log-stats-detail-item">
              <span className="change-log-stats-detail-label">Maximum:</span>
              <span className="change-log-stats-detail-value">
                {statistics.max_change_size} bytes
              </span>
            </div>
            <div className="change-log-stats-detail-item">
              <span className="change-log-stats-detail-label">Total:</span>
              <span className="change-log-stats-detail-value">
                {statistics.total_size_change} bytes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
