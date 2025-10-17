/**
 * Monitor TypeScript types
 */

export interface Monitor {
  id: number;
  name: string;
  url: string;
  monitor_type: 'webpage' | 'api';
  watch_interval: number;
  is_active: boolean;
  request_id: number | null;
  created_at: string;
  updated_at: string;
  last_checked_at: string | null;
  last_changed_at: string | null;
  status: string;
  error_message: string | null;
  check_count: number;
  change_count: number;
  // Additional fields for direct monitor configuration
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  save_cookies?: boolean;
  use_cookies?: boolean;
  cookie_request_id?: number;
}

export interface MonitorCreate {
  name: string;
  url: string;
  monitor_type?: 'webpage' | 'api';
  watch_interval?: number;
  is_active?: boolean;
  request_id?: number | null;
  // Additional fields for direct monitor configuration
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  save_cookies?: boolean;
  use_cookies?: boolean;
  cookie_request_id?: number;
}

export interface MonitorUpdate {
  name?: string;
  url?: string;
  monitor_type?: 'webpage' | 'api';
  watch_interval?: number;
  is_active?: boolean;
  request_id?: number | null;
  // Additional fields for direct monitor configuration
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  save_cookies?: boolean;
  use_cookies?: boolean;
  cookie_request_id?: number;
}

export interface MonitorWithStats extends Monitor {
  recent_changes: number;
  uptime_percentage: number;
}
