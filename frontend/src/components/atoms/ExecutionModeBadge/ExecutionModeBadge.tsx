import React from 'react';
import { ExecutionMode } from '@/types/watcher';
import './ExecutionModeBadge.css';

interface ExecutionModeBadgeProps {
  mode: ExecutionMode;
  className?: string;
}

export const ExecutionModeBadge: React.FC<ExecutionModeBadgeProps> = ({ 
  mode, 
  className = '' 
}) => {
  const getModeConfig = (mode: ExecutionMode) => {
    switch (mode) {
      case ExecutionMode.SCHEDULED:
        return {
          label: 'Scheduled',
          className: 'execution-mode-scheduled',
          icon: 'clock'
        };
      case ExecutionMode.MANUAL:
        return {
          label: 'Manual',
          className: 'execution-mode-manual',
          icon: 'play'
        };
      case ExecutionMode.BOTH:
        return {
          label: 'Both',
          className: 'execution-mode-both',
          icon: 'settings'
        };
      default:
        return {
          label: 'Unknown',
          className: 'execution-mode-unknown',
          icon: 'help'
        };
    }
  };

  const config = getModeConfig(mode);

  return (
    <span className={`execution-mode-badge ${config.className} ${className}`}>
      <span className="execution-mode-icon">{config.icon}</span>
      <span className="execution-mode-label">{config.label}</span>
    </span>
  );
};
