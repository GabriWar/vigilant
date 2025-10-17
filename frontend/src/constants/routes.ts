/**
 * Route constants
 */

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  WATCHERS: '/watchers',
  WATCHER_CREATE: '/watchers/create',
  WATCHER_EDIT: (id: string | number) => `/watchers/${id}/edit`,
  WATCHER_DETAIL: (id: string | number) => `/watchers/${id}`,
  WORKFLOWS: '/workflows',
  WORKFLOW_CREATE: '/workflows/create',
  WORKFLOW_EDIT: (id: string | number) => `/workflows/${id}/edit`,
  LOGS: '/logs',
  LOG_DETAIL: (id: string | number) => `/logs/${id}`,
  IMAGES: '/images',
  COOKIES: '/cookies',
  CHANGE_LOGS: '/change-logs',
  CHANGE_LOG_DETAIL: (id: string | number) => `/change-logs/${id}`,
  SETTINGS: '/settings',
} as const;
