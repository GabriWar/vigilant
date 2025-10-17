/**
 * ChangeLogFilters Molecule Component
 * Comprehensive filtering interface for change logs
 */
import React, { useState } from 'react';
import { Input } from '@components/atoms/Input/Input';
import { Button } from '@components/atoms/Button/Button';
import { Badge } from '@components/atoms/Badge/Badge';
import { Icon } from '@components/atoms/Icon/Icon';
import { DateRangePicker, DateRange } from '../DateRangePicker/DateRangePicker';
import { ChangeLogFilters } from '@types/changeLog';
import './ChangeLogFilters.css';

export interface ChangeLogFiltersProps {
  filters: ChangeLogFilters;
  onFiltersChange: (filters: ChangeLogFilters) => void;
  onClearFilters: () => void;
  watchers?: Array<{ id: number; name: string }>;
  className?: string;
}

export const ChangeLogFiltersComponent: React.FC<ChangeLogFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  watchers = [],
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const updateFilter = <K extends keyof ChangeLogFilters>(key: K, value: ChangeLogFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleDateRangeChange = (range: DateRange) => {
    updateFilter('date_from', range.from);
    updateFilter('date_to', range.to);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      updateFilter('search', value || undefined);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.watcher_id) count++;
    if (filters.change_type) count++;
    if (filters.date_from || filters.date_to) count++;
    if (filters.min_size) count++;
    if (filters.max_size) count++;
    if (filters.search) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={`change-log-filters ${className}`}>
      <div className="change-log-filters-header">
        <h3 className="change-log-filters-title">Filters</h3>
        {activeFiltersCount > 0 && (
          <Badge variant="primary" size="sm">
            {activeFiltersCount} active
          </Badge>
        )}
        <div className="change-log-filters-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="change-log-filters-toggle"
          >
            <Icon name={showAdvanced ? 'chevronUp' : 'chevronDown'} size="xs" />
            {showAdvanced ? 'Basic' : 'Advanced'}
          </Button>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="change-log-filters-clear"
            >
              <Icon name="x" size="xs" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="change-log-filters-content">
        {/* Basic Filters */}
        <div className="change-log-filters-section">
          <div className="change-log-filters-row">
            <div className="change-log-filters-field">
              <label className="change-log-filters-label">Search</label>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search in content..."
                size="sm"
                icon="search"
              />
            </div>

            <div className="change-log-filters-field">
              <label className="change-log-filters-label">Change Type</label>
              <select
                value={filters.change_type || ''}
                onChange={(e) => updateFilter('change_type', e.target.value as any || undefined)}
                className="change-log-filters-select"
              >
                <option value="">All</option>
                <option value="new">New</option>
                <option value="modified">Modified</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="change-log-filters-field">
              <label className="change-log-filters-label">Watcher</label>
              <select
                value={filters.watcher_id || ''}
                onChange={(e) => updateFilter('watcher_id', e.target.value ? Number(e.target.value) : undefined)}
                className="change-log-filters-select"
              >
                <option value="">All Watchers</option>
                {watchers.map(watcher => (
                  <option key={watcher.id} value={watcher.id}>
                    {watcher.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="change-log-filters-row">
            <div className="change-log-filters-field change-log-filters-field-wide">
              <label className="change-log-filters-label">Period</label>
              <DateRangePicker
                value={{ from: filters.date_from, to: filters.date_to }}
                onChange={handleDateRangeChange}
              />
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="change-log-filters-section change-log-filters-advanced">
            <div className="change-log-filters-row">
              <div className="change-log-filters-field">
                <label className="change-log-filters-label">Minimum Size (bytes)</label>
                <Input
                  type="number"
                  value={filters.min_size || ''}
                  onChange={(e) => updateFilter('min_size', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Ex: 1024"
                  size="sm"
                />
              </div>

              <div className="change-log-filters-field">
                <label className="change-log-filters-label">Maximum Size (bytes)</label>
                <Input
                  type="number"
                  value={filters.max_size || ''}
                  onChange={(e) => updateFilter('max_size', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Ex: 1048576"
                  size="sm"
                />
              </div>

              <div className="change-log-filters-field">
                <label className="change-log-filters-label">Sort by</label>
                <select
                  value={filters.order_by || 'detected_at'}
                  onChange={(e) => updateFilter('order_by', e.target.value as any)}
                  className="change-log-filters-select"
                >
                  <option value="detected_at">Detection Date</option>
                  <option value="new_size">Size</option>
                  <option value="change_type">Type</option>
                </select>
              </div>

              <div className="change-log-filters-field">
                <label className="change-log-filters-label">Direction</label>
                <select
                  value={filters.order_direction || 'desc'}
                  onChange={(e) => updateFilter('order_direction', e.target.value as any)}
                  className="change-log-filters-select"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
