import { useState, useCallback } from 'react';

interface AlertOptions {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  confirmText?: string;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  type?: 'info' | 'warning' | 'danger';
  confirmText?: string;
  cancelText?: string;
}

export const useModal = () => {
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    options: AlertOptions;
  }>({
    isOpen: false,
    options: { message: '' }
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    onConfirm?: () => void;
    isLoading?: boolean;
  }>({
    isOpen: false,
    options: { message: '' }
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertModal({
      isOpen: true,
      options
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertModal(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const showConfirm = useCallback((
    options: ConfirmOptions,
    onConfirm: () => void | Promise<void>,
    isLoading = false
  ) => {
    setConfirmModal({
      isOpen: true,
      options,
      onConfirm,
      isLoading
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmModal(prev => ({
      ...prev,
      isOpen: false,
      onConfirm: undefined,
      isLoading: false
    }));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (confirmModal.onConfirm) {
      try {
        await confirmModal.onConfirm();
        hideConfirm();
      } catch (error) {
        // Error handling is done in the calling component
        console.error('Error in confirm action:', error);
      }
    }
  }, [confirmModal.onConfirm, hideConfirm]);

  return {
    alertModal,
    confirmModal,
    showAlert,
    hideAlert,
    showConfirm,
    hideConfirm,
    handleConfirm
  };
};