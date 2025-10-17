/**
 * FilterBar Molecule Component
 * Filter controls for lists and tables
 */

import React from 'react';
import { Icon } from '../../atoms/Icon/Icon';
import './FilterBar.css';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterBarProps {
  filters: {
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
  onReset?: () => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onReset, className = '' }) => {
  const hasActiveFilters = filters.some((filter) => filter.value !== 'all' && filter.value !== '');

  return (
    <div className={`filter-bar ${className}`}>
      <div className="filter-bar-icon">
        <Icon name="filter" size="sm" />
      </div>

      <div className="filter-bar-controls">
        {filters.map((filter, index) => (
          <div key={index} className="filter-bar-item">
            <label className="filter-bar-label">{filter.label}</label>
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="filter-bar-select"
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {hasActiveFilters && onReset && (
        <button onClick={onReset} className="filter-bar-reset">
          <Icon name="x" size="sm" />
          Reset
        </button>
      )}
    </div>
  );
};
