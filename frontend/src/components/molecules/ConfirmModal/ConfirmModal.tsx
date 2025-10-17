import React from 'react';
import { Modal } from '@components/atoms/Modal/Modal';
import { Button } from '@components/atoms/Button/Button';
import { Icon } from '@components/atoms/Icon/Icon';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  type?: 'info' | 'warning' | 'danger';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false
}) => {
  const getIconName = () => {
    switch (type) {
      case 'warning':
        return 'alert-triangle';
      case 'danger':
        return 'x-circle';
      default:
        return 'help-circle';
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
    >
      <div className={`confirm-modal confirm-modal--${type}`}>
        <div className="confirm-modal-icon">
          <Icon name={getIconName()} size="lg" />
        </div>
        <div className="confirm-modal-content">
          <p className="confirm-modal-message">{message}</p>
          <div className="confirm-modal-actions">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="confirm-modal-cancel"
            >
              {cancelText}
            </Button>
            <Button
              variant={type === 'danger' ? 'danger' : 'primary'}
              onClick={handleConfirm}
              isLoading={isLoading}
              className="confirm-modal-confirm"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};