export enum ExecutionMode {
  SCHEDULED = "scheduled",
  MANUAL = "manual",
  BOTH = "both"
}

export enum ContentType {
  AUTO = "auto",
  TEXT = "text",
  JSON = "json",
  HTML = "html",
  XML = "xml",
  IMAGE = "image",
  PDF = "pdf"
}

export interface Watcher {
  id: number;
  name: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  content_type: ContentType;
  execution_mode: ExecutionMode;
  watch_interval?: number;
  is_active: boolean;
  save_cookies: boolean;
  use_cookies: boolean;
  cookie_watcher_id?: number;
  comparison_mode: string;
  status: string;
  error_message?: string;
  check_count: number;
  change_count: number;
  created_at: string;
  updated_at: string;
  last_checked_at?: string;
  last_changed_at?: string;
}

export interface WatcherCreate {
  name: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  content_type?: ContentType;
  execution_mode?: ExecutionMode;
  watch_interval?: number;
  is_active?: boolean;
  save_cookies?: boolean;
  use_cookies?: boolean;
  cookie_watcher_id?: number;
  comparison_mode?: string;
}

export interface WatcherUpdate {
  name?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  content_type?: ContentType;
  execution_mode?: ExecutionMode;
  watch_interval?: number;
  is_active?: boolean;
  save_cookies?: boolean;
  use_cookies?: boolean;
  cookie_watcher_id?: number;
  comparison_mode?: string;
}

export interface WatcherStatistics {
  total_watchers: number;
  active_watchers: number;
  inactive_watchers: number;
  total_checks: number;
  total_changes: number;
  by_execution_mode: Record<string, number>;
  by_status: Record<string, number>;
  by_content_type: Record<string, number>;
}

export interface WatcherExecutionResult {
  status: string;
  status_code?: number;
  response_body?: string;
  response_headers?: Record<string, string>;
  cookies_saved?: number;
  cookies_used?: number;
  error?: string;
}
