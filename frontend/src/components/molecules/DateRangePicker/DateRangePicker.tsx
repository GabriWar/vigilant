/**
 * DateRangePicker Molecule Component
 * Date range selection with presets
 */
import React, { useState } from 'react';
import { Input } from '@components/atoms/Input/Input';
import { Button } from '@components/atoms/Button/Button';
import { Icon } from '@components/atoms/Icon/Icon';
import './DateRangePicker.css';

export interface DateRange {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  presets?: Array<{
    label: string;
    value: DateRange;
  }>;
  className?: string;
}

const defaultPresets = [
  {
    label: 'Last 7 days',
    value: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    }
  },
  {
    label: 'Last 30 days',
    value: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    }
  },
  {
    label: 'Last 90 days',
    value: {
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    }
  },
  {
    label: 'This month',
    value: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    }
  },
  {
    label: 'Last month',
    value: {
      from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
      to: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
    }
  }
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value = {},
  onChange,
  presets = defaultPresets,
  className = ''
}) => {
  const [showPresets, setShowPresets] = useState(false);

  const handleFromChange = (from: string) => {
    onChange({ ...value, from });
  };

  const handleToChange = (to: string) => {
    onChange({ ...value, to });
  };

  const handlePresetClick = (preset: DateRange) => {
    onChange(preset);
    setShowPresets(false);
  };

  const clearRange = () => {
    onChange({});
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US');
  };

  return (
    <div className={`date-range-picker ${className}`}>
      <div className="date-range-picker-inputs">
        <div className="date-range-picker-field">
          <label className="date-range-picker-label">From:</label>
          <Input
            type="date"
            value={value.from || ''}
            onChange={(e) => handleFromChange(e.target.value)}
            placeholder="Start date"
            size="sm"
          />
        </div>
        
        <div className="date-range-picker-separator">
          <Icon name="arrowRight" size="sm" />
        </div>
        
        <div className="date-range-picker-field">
          <label className="date-range-picker-label">To:</label>
          <Input
            type="date"
            value={value.to || ''}
            onChange={(e) => handleToChange(e.target.value)}
            placeholder="End date"
            size="sm"
          />
        </div>
      </div>

      <div className="date-range-picker-actions">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowPresets(!showPresets)}
          className="date-range-picker-presets-btn"
        >
          <Icon name="calendar" size="xs" />
          Presets
        </Button>
        
        {(value.from || value.to) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearRange}
            className="date-range-picker-clear-btn"
          >
            <Icon name="x" size="xs" />
            Clear
          </Button>
        )}
      </div>

      {showPresets && (
        <div className="date-range-picker-presets">
          {presets.map((preset, index) => (
            <button
              key={index}
              className="date-range-picker-preset-item"
              onClick={() => handlePresetClick(preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {(value.from || value.to) && (
        <div className="date-range-picker-summary">
          <span className="date-range-picker-summary-text">
            {value.from && value.to
              ? `${formatDate(value.from)} - ${formatDate(value.to)}`
              : value.from
              ? `From ${formatDate(value.from)}`
              : `Until ${formatDate(value.to)}`}
          </span>
        </div>
      )}
    </div>
  );
};
