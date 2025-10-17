/**
 * Route constants
 */

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  MONITORS: '/monitors',
  MONITOR_CREATE: '/monitors/create',
  MONITOR_EDIT: (id: string | number) => `/monitors/${id}/edit`,
  MONITOR_DETAIL: (id: string | number) => `/monitors/${id}`,
  REQUESTS: '/requests',
  REQUEST_CREATE: '/requests/create',
  REQUEST_EDIT: (id: string | number) => `/requests/${id}/edit`,
  WORKFLOWS: '/workflows',
  WORKFLOW_CREATE: '/workflows/create',
  WORKFLOW_EDIT: (id: string | number) => `/workflows/${id}/edit`,
  LOGS: '/logs',
  LOG_DETAIL: (id: string | number) => `/logs/${id}`,
  IMAGES: '/images',
  SETTINGS: '/settings',
} as const;
