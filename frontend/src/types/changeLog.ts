/**
 * Change Log types
 */

export interface ChangeLog {
  id: number;
  watcher_id: number;
  change_type: 'new' | 'modified' | 'error' | 'unchanged';
  new_hash: string;
  new_size: number;
  old_hash?: string;
  old_size?: number;
  archive_path?: string;
  detected_at: string; // ISO date string
}

export interface ChangeLogWithDiff extends ChangeLog {
  diff?: string;
}

export interface ChangeLogListResponse extends ChangeLog {
  watcher_name: string;
  watcher_url: string;
}

export interface ChangeLogFilters {
  watcher_id?: number;
  change_type?: 'new' | 'modified' | 'error';
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
  min_size?: number;
  max_size?: number;
  search?: string;
  order_by?: 'detected_at' | 'new_size' | 'change_type';
  order_direction?: 'asc' | 'desc';
}

export interface FrequencyDataPoint {
  date: string; // YYYY-MM-DD
  count: number;
  new_count: number;
  modified_count: number;
  error_count: number;
}

export interface TopWatcher {
  id: number;
  name: string;
  url: string;
  execution_mode: string;
  change_count: number;
  last_change?: string; // ISO date string
}

export interface ChangeLogStatistics {
  // Totals
  total_changes: number;
  new_changes: number;
  modified_changes: number;
  error_changes: number;
  
  // Size statistics
  avg_change_size: number;
  min_change_size: number;
  max_change_size: number;
  total_size_change: number;
  
  // Frequency data for charts
  frequency_data: FrequencyDataPoint[];
  
  // Top watchers
  top_watchers: TopWatcher[];
  
  // Time range
  date_from?: string;
  date_to?: string;
}

export interface ChangeLogComparisonItem {
  id: number;
  detected_at: string; // ISO date string
  change_type: string;
  old_size?: number;
  new_size: number;
  diff?: string;
  watcher_name: string;
  watcher_url: string;
}

export interface ChangeLogComparison {
  change_logs: ChangeLogComparisonItem[];
  comparison_metadata: Record<string, any>;
}

// Extended filters for UI
export interface ChangeLogFiltersExtended extends ChangeLogFilters {
  skip?: number;
  limit?: number;
  group_by?: 'day' | 'week' | 'month';
}

// Chart data types
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  showLegend?: boolean;
}
