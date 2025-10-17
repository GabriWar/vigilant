/**
 * API constants
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export const API_ENDPOINTS = {
  // Watchers
  WATCHERS: '/api/watchers',
  WATCHER_DETAIL: (id: number) => `/api/watchers/${id}`,
  WATCHER_EXECUTE: (id: number) => `/api/watchers/${id}/execute`,
  WATCHER_STATISTICS: '/api/watchers/statistics',
  
  // Workflows
  WORKFLOWS: '/api/workflows/',
  WORKFLOW_DETAIL: (id: number) => `/api/workflows/${id}`,
  WORKFLOW_EXECUTE: (id: number) => `/api/workflows/${id}/execute`,
  WORKFLOW_EXECUTIONS: (id: number) => `/api/workflows/${id}/executions`,
  WORKFLOW_VARIABLES: (id: number) => `/api/workflows/${id}/variables`,
  
  // Logs
  LOGS: '/api/change-logs',
  LOG_DETAIL: (id: number) => `/api/change-logs/${id}`,
  WATCHER_LOGS: (watcherId: number) => `/api/watchers/${watcherId}/logs`,
  
  // Images
  IMAGES: '/api/images',
  IMAGE_DETAIL: (id: number) => `/api/images/${id}`,
  IMAGE_DOWNLOAD: (id: number) => `/api/images/${id}/download`,
  
  // Change Logs
  CHANGE_LOGS: '/api/change-logs',
  CHANGE_LOG_DETAIL: (id: number) => `/api/change-logs/${id}`,
  CHANGE_LOG_STATISTICS: '/api/change-logs/statistics',
  CHANGE_LOG_COMPARE: '/api/change-logs/compare',
  
  // Settings
  SETTINGS: '/api/settings',
} as const;
