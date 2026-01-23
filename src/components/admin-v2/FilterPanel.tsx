'use client';

import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface Filter {
  id: string;
  label: string;
  type: 'select' | 'daterange' | 'checkbox' | 'text';
  options?: FilterOption[];
  value?: any;
  placeholder?: string;
}

export interface FilterPanelProps {
  filters: Filter[];
  onFiltersChange: (filters: Filter[]) => void;
  onApply?: () => void;
  onReset?: () => void;
}

/**
 * FilterPanel Component
 * 
 * Advanced filtering interface with multiple filter types
 * Supports select, date range, checkbox, and text filters
 * 
 * @example
 * ```tsx
 * <FilterPanel
 *   filters={[
 *     { id: 'status', label: 'Status', type: 'select', options: [...] },
 *     { id: 'date', label: 'Date Range', type: 'daterange' },
 *   ]}
 *   onFiltersChange={(f) => applyFilters(f)}
 * />
 * ```
 */
export function FilterPanel({
  filters: initialFilters,
  onFiltersChange,
  onApply,
  onReset,
}: FilterPanelProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

  const activeFilterCount = filters.filter((f) => f.value).length;

  const handleFilterChange = (filterId: string, value: any) => {
    const updated = filters.map((f) => (f.id === filterId ? { ...f, value } : f));
    setFilters(updated);
    onFiltersChange(updated);
  };

  const handleReset = () => {
    const reset = filters.map((f) => ({ ...f, value: undefined }));
    setFilters(reset);
    onFiltersChange(reset);
    onReset?.();
  };

  const handleApply = () => {
    onApply?.();
  };

  const renderFilterInput = (filter: Filter) => {
    switch (filter.type) {
      case 'select':
        return (
          <select
            value={filter.value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{filter.placeholder || 'Select...'}</option>
            {filter.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'daterange':
        return (
          <div className="flex gap-2">
            <input
              type="date"
              value={filter.value?.from || ''}
              onChange={(e) =>
                handleFilterChange(filter.id, {
                  ...filter.value,
                  from: e.target.value,
                })
              }
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="From"
            />
            <input
              type="date"
              value={filter.value?.to || ''}
              onChange={(e) =>
                handleFilterChange(filter.id, {
                  ...filter.value,
                  to: e.target.value,
                })
              }
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="To"
            />
          </div>
        );

      case 'text':
        return (
          <input
            type="text"
            value={filter.value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value || undefined)}
            placeholder={filter.placeholder || 'Enter text...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {filter.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filter.value?.includes(opt.value) || false}
                  onChange={(e) => {
                    const current = filter.value || [];
                    const updated = e.target.checked
                      ? [...current, opt.value]
                      : current.filter((v: string) => v !== opt.value);
                    handleFilterChange(filter.id, updated.length > 0 ? updated : undefined);
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            Filters {activeFilterCount > 0 && <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1">{activeFilterCount}</span>}
          </span>
        </div>
        <ChevronDown
          size={20}
          className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          {filters.map((filter) => (
            <div key={filter.id} className="space-y-2">
              <button
                onClick={() => setExpandedFilter(expandedFilter === filter.id ? null : filter.id)}
                className="w-full flex items-center justify-between text-left"
              >
                <label className="text-sm font-medium text-gray-700">{filter.label}</label>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${
                    expandedFilter === filter.id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedFilter === filter.id && <div className="bg-gray-50 p-3 rounded">{renderFilterInput(filter)}</div>}
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={handleApply}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Apply Filters
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={handleReset}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
