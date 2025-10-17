import React from 'react';
import { Modal } from '@components/atoms/Modal/Modal';
import { Button } from '@components/atoms/Button/Button';
import { Icon } from '@components/atoms/Icon/Icon';
import './AlertModal.css';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  confirmText?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK'
}) => {
  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'alert-triangle';
      case 'error':
        return 'x-circle';
      default:
        return 'info';
    }
  };

  const getTitle = () => {
    if (title) return title;
    
    switch (type) {
      case 'success':
        return 'Success';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      default:
        return 'Information';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      size="sm"
      showCloseButton={false}
    >
      <div className={`alert-modal alert-modal--${type}`}>
        <div className="alert-modal-icon">
          <Icon name={getIconName()} size="lg" />
        </div>
        <div className="alert-modal-content">
          <p className="alert-modal-message">{message}</p>
          <div className="alert-modal-actions">
            <Button
              variant="primary"
              onClick={onClose}
              className="alert-modal-button"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};