/**
 * Web Push Notifications Service
 */
import { apiClient } from './api/client';
import { API_ENDPOINTS } from '@constants/api';

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Initialize service worker and notifications
   */
  async init(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', this.swRegistration);

      // Check for existing subscription
      const existingSubscription = await this.swRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Existing push subscription found');
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<boolean> {
    try {
      const permission = await this.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      if (!this.swRegistration) {
        await this.init();
      }

      if (!this.swRegistration) {
        throw new Error('Service Worker not registered');
      }

      // Get VAPID public key from backend
      const { data: { public_key } } = await apiClient.get('/api/notifications/vapid-public-key');

      // Subscribe to push
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(public_key)
      });

      // Send subscription to backend
      await apiClient.post('/api/notifications/subscribe', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      });

      console.log('Successfully subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        return false;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (subscription) {
        // Unsubscribe on backend
        await apiClient.post('/api/notifications/unsubscribe', {
          endpoint: subscription.endpoint
        });

        // Unsubscribe locally
        await subscription.unsubscribe();
        console.log('Successfully unsubscribed from push notifications');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Check if user is subscribed
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.swRegistration) {
      await this.init();
    }

    if (!this.swRegistration) {
      return false;
    }

    const subscription = await this.swRegistration.pushManager.getSubscription();
    return subscription !== null;
  }

  /**
   * Send test notification (for testing purposes)
   */
  async sendTestNotification(): Promise<void> {
    await apiClient.post('/api/notifications/send', {
      title: 'Test Notification',
      body: 'This is a test notification from Vigilant Monitor',
      icon: '/icon.png',
      tag: 'test-notification'
    });
  }

  // Helper methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export const notificationService = new NotificationService();
