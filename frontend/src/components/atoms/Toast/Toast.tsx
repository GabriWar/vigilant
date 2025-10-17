/**
 * Toast notification component
 */
import React, { useEffect, useState } from 'react';
import { Icon } from '@components/atoms/Icon/Icon';
import './Toast.css';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  timestamp: string;
}

interface ToastProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const getIconName = () => {
    switch (toast.type) {
      case 'success': return 'check-circle';
      case 'error': return 'x-circle';
      case 'warning': return 'alert-triangle';
      default: return 'info';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div 
      className={`toast ${toast.type} ${isVisible ? 'visible' : ''} ${isLeaving ? 'leaving' : ''}`}
      onClick={handleRemove}
    >
      <div className="toast-content">
        <div className="toast-icon">
          <Icon name={getIconName()} size="sm" />
        </div>
        <div className="toast-body">
          <div className="toast-title">{toast.title}</div>
          <div className="toast-message">{toast.message}</div>
          <div className="toast-time">{formatTime(toast.timestamp)}</div>
        </div>
        <button className="toast-close" onClick={handleRemove}>
          <Icon name="x" size="xs" />
        </button>
      </div>
    </div>
  );
};
