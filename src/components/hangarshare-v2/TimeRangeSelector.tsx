// Component: Time Range Selector for Analytics
// File: src/components/hangarshare-v2/TimeRangeSelector.tsx
// Purpose: Allow users to select different time ranges for analytics

'use client';

import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'custom';

interface TimeRangeSelectorProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
  onCustomDateChange?: (startDate: string, endDate: string) => void;
  showCustom?: boolean;
}

export function TimeRangeSelector({
  selected,
  onChange,
  onCustomDateChange,
  showCustom = true,
}: TimeRangeSelectorProps) {
  const [isCustomRangeOpen, setIsCustomRangeOpen] = React.useState(false);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const timeRanges: Array<{
    id: TimeRange;
    label: string;
    description: string;
  }> = [
    { id: '7d', label: 'Last 7 Days', description: '7 dias' },
    { id: '30d', label: 'Last 30 Days', description: '30 dias' },
    { id: '90d', label: 'Last 90 Days', description: '90 dias' },
    { id: '1y', label: 'Last Year', description: '1 ano' },
    ...(showCustom ? [{ id: 'custom' as TimeRange, label: 'Custom Range', description: 'Personalizado' }] : []),
  ];

  const handleRangeSelect = (range: TimeRange) => {
    onChange(range);
    if (range === 'custom') {
      setIsCustomRangeOpen(true);
    } else {
      setIsCustomRangeOpen(false);
    }
  };

  const handleApplyCustom = () => {
    if (startDate && endDate && onCustomDateChange) {
      onCustomDateChange(startDate, endDate);
      setIsCustomRangeOpen(false);
    }
  };

  const getSelectedLabel = () => {
    const range = timeRanges.find((r) => r.id === selected);
    return range?.label || 'Select Range';
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Desktop View: Buttons */}
      <div className="hidden sm:flex gap-2 flex-wrap">
        {timeRanges.map((range) => (
          <button
            key={range.id}
            onClick={() => handleRangeSelect(range.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              selected === range.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={range.description}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Mobile View: Dropdown */}
      <div className="sm:hidden">
        <div className="relative">
          <button className="w-full px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar size={16} />
              {getSelectedLabel()}
            </span>
            <ChevronDown size={16} />
          </button>

          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
            {timeRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => handleRangeSelect(range.id)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  selected === range.id ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Date Range Inputs */}
      {selected === 'custom' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleApplyCustom}
            disabled={!startDate || !endDate}
            className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
