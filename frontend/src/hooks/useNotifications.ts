/**
 * Hook for managing notifications with toast integration
 */
import { useEffect } from 'react';
import { notificationService, PingNotification, CookieNotification } from '@services/notifications';
import { useToast } from './useToast';

export const useNotifications = () => {
  const { showSuccess, showInfo, showError } = useToast();

  useEffect(() => {
    const handleNotification = (notification: any) => {
      if (notification.type === 'ping') {
        const pingData = notification.data as PingNotification;
        showSuccess(
          'Ping Received! 🎉',
          `Random value: ${pingData.random_value} | Server: ${pingData.data.server}`,
          8000
        );
      } else if (notification.type === 'cookie') {
        const cookieData = notification.data as CookieNotification;
        showInfo(
          'Cookie Updated! 🍪',
          `${cookieData.cookie_name}: ${cookieData.cookie_value}`,
          6000
        );
      } else if (notification.type === 'error') {
        showError(
          'Notification Error',
          notification.data.error || 'Unknown error occurred'
        );
      }
    };

    notificationService.addListener(handleNotification);

    return () => {
      notificationService.removeListener(handleNotification);
    };
  }, [showSuccess, showInfo, showError]);

  const startListening = () => {
    notificationService.startListening();
  };

  const stopListening = () => {
    notificationService.stopListening();
  };

  const testPing = async () => {
    try {
      const result = await notificationService.testPing();
      showSuccess(
        'Test Ping Success! 🚀',
        `Random value: ${result.random_value} | ${result.message}`,
        5000
      );
    } catch (error) {
      showError('Test Ping Failed', 'Failed to ping server');
    }
  };

  const testCookie = async () => {
    try {
      const result = await notificationService.testCookie();
      showInfo(
        'Test Cookie Success! 🍪',
        `${result.cookie_name}: ${result.cookie_value}`,
        5000
      );
    } catch (error) {
      showError('Test Cookie Failed', 'Failed to get test cookie');
    }
  };

  return {
    startListening,
    stopListening,
    testPing,
    testCookie
  };
};
