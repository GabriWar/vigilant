/**
 * Chart Atom Component
 * Simple chart wrapper using CSS and basic SVG
 */
import React from 'react';
import { ChartConfig, ChartSeries } from '@types/changeLog';
import './Chart.css';

export interface ChartProps {
  config: ChartConfig;
  series: ChartSeries[];
  className?: string;
}

export const Chart: React.FC<ChartProps> = ({ config, series, className = '' }) => {
  const { type, title, height = 300, showLegend = true } = config;

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <LineChart series={series} height={height} />;
      case 'bar':
        return <BarChart series={series} height={height} />;
      case 'pie':
        return <PieChart series={series} height={height} />;
      case 'area':
        return <AreaChart series={series} height={height} />;
      default:
        return <LineChart series={series} height={height} />;
    }
  };

  return (
    <div className={`chart ${className}`}>
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="chart-container" style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
      {showLegend && series.length > 1 && (
        <div className="chart-legend">
          {series.map((s, index) => (
            <div key={index} className="chart-legend-item">
              <div 
                className="chart-legend-color" 
                style={{ backgroundColor: s.color || `hsl(${index * 60}, 70%, 50%)` }}
              />
              <span className="chart-legend-label">{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Simple Line Chart Component
const LineChart: React.FC<{ series: ChartSeries[]; height: number }> = ({ series, height }) => {
  const allValues = series.flatMap(s => s.data.map(d => d.y)).filter(v => !isNaN(v) && isFinite(v));
  
  if (allValues.length === 0) {
    return (
      <svg width={400} height={height} className="chart-svg">
        <text x="200" y={height / 2} textAnchor="middle" fill="var(--color-text-secondary)">
          No data available
        </text>
      </svg>
    );
  }
  
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  const range = maxValue - minValue || 1;
  
  const padding = 40;
  const chartWidth = 400;
  const chartHeight = height - padding * 2;

  const getY = (value: number) => {
    if (isNaN(value) || !isFinite(value)) return chartHeight + padding;
    return chartHeight - ((value - minValue) / range) * chartHeight + padding;
  };

  const getX = (index: number, total: number) => {
    if (total <= 1) return chartWidth / 2 + padding;
    return (index / (total - 1)) * chartWidth + padding;
  };

  return (
    <svg width={chartWidth + padding * 2} height={height} className="chart-svg">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
        <line
          key={index}
          x1={padding}
          y1={padding + ratio * chartHeight}
          x2={chartWidth + padding}
          y2={padding + ratio * chartHeight}
          stroke="var(--color-border)"
          strokeWidth="1"
        />
      ))}

      {/* Data lines */}
      {series.map((s, seriesIndex) => {
        const points = s.data.map((point, index) => {
          const x = getX(index, s.data.length);
          const y = getY(point.y);
          return `${x},${y}`;
        }).join(' ');

        return (
          <polyline
            key={seriesIndex}
            points={points}
            fill="none"
            stroke={s.color || `hsl(${seriesIndex * 60}, 70%, 50%)`}
            strokeWidth="2"
          />
        );
      })}

      {/* Data points */}
      {series.map((s, seriesIndex) =>
        s.data.map((point, index) => {
          const x = getX(index, s.data.length);
          const y = getY(point.y);
          return (
            <circle
              key={`${seriesIndex}-${index}`}
              cx={x}
              cy={y}
              r="4"
              fill={s.color || `hsl(${seriesIndex * 60}, 70%, 50%)`}
            />
          );
        })
      )}
    </svg>
  );
};

// Simple Bar Chart Component
const BarChart: React.FC<{ series: ChartSeries[]; height: number }> = ({ series, height }) => {
  const allValues = series.flatMap(s => s.data.map(d => d.y)).filter(v => !isNaN(v) && isFinite(v));
  
  if (allValues.length === 0) {
    return (
      <svg width={400} height={height} className="chart-svg">
        <text x="200" y={height / 2} textAnchor="middle" fill="var(--color-text-secondary)">
          No data available
        </text>
      </svg>
    );
  }
  
  const maxValue = Math.max(...allValues);
  const range = maxValue || 1;
  
  const padding = 40;
  const chartWidth = 400;
  const chartHeight = height - padding * 2;
  const barWidth = chartWidth / (series[0]?.data.length || 1) * 0.8;

  const getY = (value: number) => {
    if (isNaN(value) || !isFinite(value)) return chartHeight + padding;
    return chartHeight - (value / range) * chartHeight + padding;
  };

  const getX = (index: number, total: number) => {
    if (total <= 0) return chartWidth / 2 + padding;
    return (index / total) * chartWidth + padding + (chartWidth / total - barWidth) / 2;
  };

  return (
    <svg width={chartWidth + padding * 2} height={height} className="chart-svg">
      {/* Bars */}
      {series.map((s, seriesIndex) =>
        s.data.map((point, index) => {
          const x = getX(index, s.data.length);
          const y = getY(point.y);
          const barHeight = chartHeight - ((isNaN(point.y) || !isFinite(point.y) ? 0 : point.y) / range) * chartHeight;
          
          return (
            <rect
              key={`${seriesIndex}-${index}`}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={s.color || `hsl(${seriesIndex * 60}, 70%, 50%)`}
              opacity="0.8"
            />
          );
        })
      )}
    </svg>
  );
};

// Simple Pie Chart Component
const PieChart: React.FC<{ series: ChartSeries[]; height: number }> = ({ series, height }) => {
  const total = series.reduce((sum, s) => sum + s.data.reduce((sSum, d) => sSum + (isNaN(d.y) || !isFinite(d.y) ? 0 : d.y), 0), 0);
  
  if (total === 0) {
    return (
      <svg width={400} height={height} className="chart-svg">
        <text x="200" y={height / 2} textAnchor="middle" fill="var(--color-text-secondary)">
          No data available
        </text>
      </svg>
    );
  }
  
  const radius = Math.min(height - 40, 150) / 2;
  const centerX = radius + 20;
  const centerY = radius + 20;

  let currentAngle = 0;

  return (
    <svg width={radius * 2 + 40} height={height} className="chart-svg">
      {series.map((s, seriesIndex) =>
        s.data.map((point, index) => {
          const value = isNaN(point.y) || !isFinite(point.y) ? 0 : point.y;
          const percentage = value / total;
          const angle = percentage * 360;
          const endAngle = currentAngle + angle;
          
          const startAngleRad = (currentAngle * Math.PI) / 180;
          const endAngleRad = (endAngle * Math.PI) / 180;
          
          const x1 = centerX + radius * Math.cos(startAngleRad);
          const y1 = centerY + radius * Math.sin(startAngleRad);
          const x2 = centerX + radius * Math.cos(endAngleRad);
          const y2 = centerY + radius * Math.sin(endAngleRad);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');

          currentAngle = endAngle;

          return (
            <path
              key={`${seriesIndex}-${index}`}
              d={pathData}
              fill={s.color || `hsl(${seriesIndex * 60}, 70%, 50%)`}
            />
          );
        })
      )}
    </svg>
  );
};

// Simple Area Chart Component
const AreaChart: React.FC<{ series: ChartSeries[]; height: number }> = ({ series, height }) => {
  const allValues = series.flatMap(s => s.data.map(d => d.y)).filter(v => !isNaN(v) && isFinite(v));
  
  if (allValues.length === 0) {
    return (
      <svg width={400} height={height} className="chart-svg">
        <text x="200" y={height / 2} textAnchor="middle" fill="var(--color-text-secondary)">
          No data available
        </text>
      </svg>
    );
  }
  
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  const range = maxValue - minValue || 1;
  
  const padding = 40;
  const chartWidth = 400;
  const chartHeight = height - padding * 2;

  const getY = (value: number) => {
    if (isNaN(value) || !isFinite(value)) return chartHeight + padding;
    return chartHeight - ((value - minValue) / range) * chartHeight + padding;
  };

  const getX = (index: number, total: number) => {
    if (total <= 1) return chartWidth / 2 + padding;
    return (index / (total - 1)) * chartWidth + padding;
  };

  return (
    <svg width={chartWidth + padding * 2} height={height} className="chart-svg">
      {/* Areas */}
      {series.map((s, seriesIndex) => {
        const points = s.data.map((point, index) => {
          const x = getX(index, s.data.length);
          const y = getY(point.y);
          return `${x},${y}`;
        }).join(' ');

        const areaPath = [
          `M ${getX(0, s.data.length)},${chartHeight + padding}`,
          `L ${points.split(' ').map(p => p.split(',')[0]).join(',')}`,
          `L ${getX(s.data.length - 1, s.data.length)},${chartHeight + padding}`,
          'Z'
        ].join(' ');

        return (
          <path
            key={seriesIndex}
            d={areaPath}
            fill={s.color || `hsl(${seriesIndex * 60}, 70%, 50%)`}
            opacity="0.3"
          />
        );
      })}

      {/* Lines */}
      {series.map((s, seriesIndex) => {
        const points = s.data.map((point, index) => {
          const x = getX(index, s.data.length);
          const y = getY(point.y);
          return `${x},${y}`;
        }).join(' ');

        return (
          <polyline
            key={`line-${seriesIndex}`}
            points={points}
            fill="none"
            stroke={s.color || `hsl(${seriesIndex * 60}, 70%, 50%)`}
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
};