/**
 * API constants
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export const API_ENDPOINTS = {
  // Monitors
  MONITORS: '/api/monitors',
  MONITOR_DETAIL: (id: number) => `/api/monitors/${id}`,
  MONITOR_STATUS: (id: number) => `/api/monitors/${id}/status`,
  
  // Requests
  REQUESTS: '/api/requests',
  REQUEST_DETAIL: (id: number) => `/api/requests/${id}`,
  
  // Logs
  LOGS: '/api/logs',
  LOG_DETAIL: (id: number) => `/api/logs/${id}`,
  MONITOR_LOGS: (monitorId: number) => `/api/monitors/${monitorId}/logs`,
  
  // Images
  IMAGES: '/api/images',
  IMAGE_DETAIL: (id: number) => `/api/images/${id}`,
  IMAGE_DOWNLOAD: (id: number) => `/api/images/${id}/download`,
  
  // Settings
  SETTINGS: '/api/settings',
} as const;
