/**
 * Notification service for real-time updates
 */
import { apiClient } from './api/client';

export interface PingNotification {
  status: string;
  message: string;
  timestamp: string;
  random_value: number;
  data: {
    server: string;
    version: string;
    uptime: string;
  };
}

export interface CookieNotification {
  status: string;
  message: string;
  cookie_name: string;
  cookie_value: string;
  timestamp: string;
}

class NotificationService {
  private listeners: Array<(data: any) => void> = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastPingTime: string | null = null;

  /**
   * Start listening for notifications
   */
  startListening() {
    if (this.pollingInterval) {
      return; // Already listening
    }

    this.startPolling();
  }

  /**
   * Stop listening for notifications
   */
  stopListening() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Add notification listener
   */
  addListener(callback: (data: any) => void) {
    this.listeners.push(callback);
  }

  /**
   * Remove notification listener
   */
  removeListener(callback: (data: any) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(data: any) {
    this.listeners.forEach(listener => listener(data));
  }

  /**
   * Start polling for ping results
   */
  private startPolling() {
    // Poll every 10 seconds to check for recent ping results
    this.pollingInterval = setInterval(async () => {
      try {
        // Get recent logs that might contain ping results
        const response = await apiClient.get('/api/change-logs?limit=10');
        const logs = response.data;
        
        // Check for ping-related logs
        const pingLogs = logs.filter((log: any) => 
          log.url && log.url.includes('/api/test/ping') && 
          log.created_at > (this.lastPingTime || '1970-01-01')
        );
        
        if (pingLogs.length > 0) {
          const latestPing = pingLogs[0];
          this.lastPingTime = latestPing.created_at;
          
          this.notifyListeners({
            type: 'ping',
            data: {
              status: 'success',
              message: 'Ping received!',
              timestamp: new Date().toISOString(),
              random_value: Math.floor(Math.random() * 9000) + 1000,
              data: {
                server: 'vigilant-backend',
                version: '2.0.0',
                uptime: 'running'
              },
              response_data: latestPing
            }
          });
        }
      } catch (error) {
        console.error('Error polling for notifications:', error);
      }
    }, 10000);
  }

  /**
   * Test ping endpoint
   */
  async testPing(): Promise<PingNotification> {
    const response = await apiClient.get('/api/test/ping');
    return response.data;
  }

  /**
   * Test cookie endpoint
   */
  async testCookie(): Promise<CookieNotification> {
    const response = await apiClient.get('/api/test/cookie-teste');
    return response.data;
  }
}

export const notificationService = new NotificationService();