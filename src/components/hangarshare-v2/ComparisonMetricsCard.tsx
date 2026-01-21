// Component: Comparison Metrics Card
// File: src/components/hangarshare-v2/ComparisonMetricsCard.tsx
// Purpose: Display metrics with period-over-period comparison

'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonMetricsCardProps {
  label: string;
  current: number;
  previous?: number;
  unit?: string;
  formatAs?: 'currency' | 'percentage' | 'number';
  size?: 'sm' | 'md' | 'lg';
  showTrend?: boolean;
}

export function ComparisonMetricsCard({
  label,
  current,
  previous,
  unit = '',
  formatAs = 'number',
  size = 'md',
  showTrend = true,
}: ComparisonMetricsCardProps) {
  const hasComparison = previous !== undefined && previous !== null;
  const change = hasComparison ? current - previous : 0;
  const percentChange =
    hasComparison && (previous as number) !== 0 ? ((change / (previous as number)) * 100).toFixed(1) : '0';
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

  // Format display values
  const formatValue = (value: number): string => {
    switch (formatAs) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'number':
      default:
        return Math.round(value).toLocaleString('pt-BR');
    }
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${sizeClasses[size]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-gray-600 font-medium ${labelSizeClasses[size]} mb-2`}>{label}</p>
          <p className={`font-bold text-gray-900 ${valueSizeClasses[size]}`}>{formatValue(current)}</p>

          {/* Comparison Section */}
          {hasComparison && showTrend && (
            <div className="mt-3 flex items-center gap-2">
              <div
                className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded ${
                  trend === 'up'
                    ? 'bg-green-50 text-green-700'
                    : trend === 'down'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-gray-50 text-gray-700'
                }`}
              >
                {trend === 'up' ? (
                  <TrendingUp size={14} />
                ) : trend === 'down' ? (
                  <TrendingDown size={14} />
                ) : (
                  <Minus size={14} />
                )}
                <span>
                  {Math.abs(parseFloat(percentChange)).toFixed(1)}% {trend === 'stable' ? 'vs anterior' : 'vs mês anterior'}
                </span>
              </div>
            </div>
          )}

          {/* Comparison Detail (optional) */}
          {hasComparison && !showTrend && (
            <p className="text-gray-500 text-xs mt-2">Anterior: {formatValue(previous as number)}</p>
          )}
        </div>

        {/* Trend Icon (large variant) */}
        {size === 'lg' && showTrend && hasComparison && (
          <div
            className={`p-2 rounded-full ${
              trend === 'up'
                ? 'bg-green-100 text-green-600'
                : trend === 'down'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            {trend === 'up' ? <TrendingUp size={24} /> : trend === 'down' ? <TrendingDown size={24} /> : <Minus size={24} />}
          </div>
        )}
      </div>
    </div>
  );
}
