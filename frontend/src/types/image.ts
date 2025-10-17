/**
 * Image types
 */

export interface Image {
  id: number;
  filename: string;
  original_url: string;
  file_path: string;
  file_size: number | null;
  width: number | null;
  height: number | null;
  mime_type: string | null;
  image_metadata: Record<string, any> | null;
  monitor_id: number;
  downloaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface ImageCreate {
  filename: string;
  original_url: string;
  file_path: string;
  file_size?: number;
  width?: number;
  height?: number;
  mime_type?: string;
  image_metadata?: Record<string, any>;
  monitor_id: number;
}

export interface ImageUpdate {
  filename?: string;
  original_url?: string;
  file_path?: string;
  file_size?: number;
  width?: number;
  height?: number;
  mime_type?: string;
  image_metadata?: Record<string, any>;
}

export interface ImageListParams {
  skip?: number;
  limit?: number;
  monitor_id?: number;
}