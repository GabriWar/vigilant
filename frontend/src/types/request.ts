/**
 * Request types
 */
export interface Request {
  id: number;
  name: string;
  request_data: string; // JSON string
  save_cookies: boolean;
  use_cookies: boolean;
  cookie_request_id: number | null;
  watch_interval: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_executed_at: string | null;
}

export interface RequestCreate {
  name: string;
  request_data: string;
  save_cookies: boolean;
  use_cookies: boolean;
  cookie_request_id: number | null;
  watch_interval: number | null;
  is_active: boolean;
}

export interface RequestUpdate {
  name?: string;
  request_data?: string;
  save_cookies?: boolean;
  use_cookies?: boolean;
  cookie_request_id?: number | null;
  watch_interval?: number | null;
  is_active?: boolean;
}

export interface RequestFormData {
  name: string;
  url: string;
  method: string;
  headers: string;
  body: string;
  save_cookies: boolean;
  use_cookies: boolean;
  cookie_request_id?: number;
  watch_interval: number | null;
  is_active: boolean;
}