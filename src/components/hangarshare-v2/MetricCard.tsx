// Component: Metric Card
// File: src/components/hangarshare-v2/MetricCard.tsx
// Purpose: Display individual metric with icon, value, and status indicator

'use client';

import React from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon?: string;
  change?: number;
  status?: 'healthy' | 'warning' | 'critical';
  unit?: string;
  onClick?: () => void;
}

const statusColors = {
  healthy: 'bg-green-50 border-green-200 text-green-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  critical: 'bg-red-50 border-red-200 text-red-900',
  default: 'bg-blue-50 border-blue-200 text-blue-900',
};

const iconMap: Record<string, string> = {
  users: '👥',
  briefcase: '💼',
  home: '🏠',
  calendar: '📅',
  dollar: '💰',
  chart: '📊',
  alert: '⚠️',
  checkmark: '✓',
  clock: '⏱️',
  trending: '📈',
};

export function MetricCard({
  title,
  value,
  icon = 'chart',
  change,
  status = 'default',
  unit = '',
  onClick,
}: MetricCardProps) {
  const statusColor = statusColors[status as keyof typeof statusColors] || statusColors.default;
  const displayIcon = iconMap[icon] || icon;

  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toLocaleString();
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-6 rounded-lg border-2 transition-all duration-200
        ${statusColor}
        ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : ''}
      `}
    >
      {/* Header with icon and title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
        </div>
        <span className="text-3xl" aria-label={icon}>
          {displayIcon}
        </span>
      </div>

      {/* Main metric value */}
      <div className="mb-2">
        <p className="text-3xl font-bold">
          {formatValue(value)}
          {unit && <span className="text-lg ml-1">{unit}</span>}
        </p>
      </div>

      {/* Change indicator */}
      {change !== undefined && (
        <div className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change)}% from last period
        </div>
      )}

      {/* Status badge */}
      <div className="mt-4 pt-4 border-t border-current border-opacity-20">
        <span
          className={`
            inline-block px-3 py-1 rounded-full text-xs font-semibold
            ${status === 'healthy' && 'bg-green-200 text-green-800'}
            ${status === 'warning' && 'bg-yellow-200 text-yellow-800'}
            ${status === 'critical' && 'bg-red-200 text-red-800'}
            ${status === 'default' && 'bg-blue-200 text-blue-800'}
          `}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    </div>
  );
}

/**
 * Grid component for displaying multiple metrics
 */
interface MetricsGridProps {
  metrics: MetricCardProps[];
  columns?: 1 | 2 | 3 | 4;
}

export function MetricsGrid({ metrics, columns = 4 }: MetricsGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  return (
    <div className={`grid grid-cols-1 gap-4 ${gridCols[columns]}`}>
      {metrics.map((metric, index) => (
        <MetricCard key={`${metric.title}-${index}`} {...metric} />
      ))}
    </div>
  );
}
