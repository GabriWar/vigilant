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
}

export interface MonitorCreate {
  name: string;
  url: string;
  monitor_type?: 'webpage' | 'api';
  watch_interval?: number;
  is_active?: boolean;
  request_id?: number | null;
}

export interface MonitorUpdate {
  name?: string;
  url?: string;
  monitor_type?: 'webpage' | 'api';
  watch_interval?: number;
  is_active?: boolean;
  request_id?: number | null;
}

export interface MonitorWithStats extends Monitor {
  recent_changes: number;
  uptime_percentage: number;
}
