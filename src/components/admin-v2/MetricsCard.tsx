'use client';

import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export interface MetricsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number; // percentage change
  trend?: 'up' | 'down' | 'neutral';
  status?: 'success' | 'warning' | 'critical' | 'neutral';
  icon?: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  tooltip?: string;
}

const statusColors = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-600',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    icon: 'text-yellow-600',
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-600',
  },
  neutral: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    icon: 'text-gray-600',
  },
};

const trendColors = {
  up: 'text-green-600',
  down: 'text-red-600',
  neutral: 'text-gray-600',
};

/**
 * MetricsCard Component
 * 
 * Displays a single metric with optional trend, status indicator, and click handler
 * 
 * @example
 * ```tsx
 * <MetricsCard
 *   title="Total Hangars"
 *   value={245}
 *   change={12.5}
 *   trend="up"
 *   status="success"
 *   icon={<Hangar size={24} />}
 * />
 * ```
 */
export function MetricsCard({
  title,
  value,
  unit,
  change,
  trend = 'neutral',
  status = 'neutral',
  icon,
  onClick,
  loading = false,
  tooltip,
}: MetricsCardProps) {
  const colors = statusColors[status];

  if (loading) {
    return (
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-6 animate-pulse`}>
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  return (
    <div
      className={`${colors.bg} border ${colors.border} rounded-lg p-6 transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      }`}
      onClick={onClick}
      title={tooltip}
    >
      {/* Header with icon and title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        </div>
        {icon && <div className={`${colors.icon} flex-shrink-0`}>{icon}</div>}
      </div>

      {/* Main value */}
      <div className="mb-3">
        <p className="text-3xl font-bold text-gray-900">
          {value}
          {unit && <span className="text-lg text-gray-500 ml-1">{unit}</span>}
        </p>
      </div>

      {/* Trend indicator */}
      {change !== undefined && (
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 ${trendColors[trend]}`}>
            {trend === 'up' && <TrendingUp size={16} />}
            {trend === 'down' && <TrendingDown size={16} />}
            <span className="text-sm font-medium">
              {Math.abs(change) > 0 ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : 'No change'}
            </span>
          </div>
          <span className="text-xs text-gray-500">vs last month</span>
        </div>
      )}

      {/* Status indicator for critical alerts */}
      {status === 'critical' && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          <span>Requires attention</span>
        </div>
      )}
    </div>
  );
}

/**
 * MetricsGrid Component
 * Renders a grid of MetricsCard components
 */
export function MetricsGrid({ cards }: { cards: MetricsCardProps[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <MetricsCard key={idx} {...card} />
      ))}
    </div>
  );
}
