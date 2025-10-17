/**
 * SearchBar Molecule Component
 * Search input with icon and clear button
 */

import React, { useState } from 'react';
import { Input } from '../../atoms/Input/Input';
import { Icon } from '../../atoms/Icon/Icon';
import './SearchBar.css';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (value: string) => void;
  fullWidth?: boolean;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  onSearch,
  fullWidth = false,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  const handleClear = () => {
    onChange('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className={`search-bar ${fullWidth ? 'search-bar-full-width' : ''} ${className}`}>
      <div className={`search-bar-wrapper ${isFocused ? 'search-bar-focused' : ''}`}>
        <Icon name="search" size="sm" className="search-bar-icon" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="search-bar-input"
        />
        {value && (
          <button onClick={handleClear} className="search-bar-clear" aria-label="Clear search">
            <Icon name="x" size="sm" />
          </button>
        )}
      </div>
    </div>
  );
};
