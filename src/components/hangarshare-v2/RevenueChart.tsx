// Component: Revenue Chart
// File: src/components/hangarshare-v2/RevenueChart.tsx
// Purpose: Display revenue trends using line chart

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RevenueData {
  month: string;
  revenue: number;
  target?: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  height?: number;
  showLegend?: boolean;
}

export function RevenueChart({
  data,
  height = 300,
  showLegend = true,
}: RevenueChartProps) {
  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full bg-white rounded-lg border-2 border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend</h3>

      {data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-gray-500">
          <p>No data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : 'N/A'}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
            />
            {showLegend && <Legend />}

            {/* Actual revenue line */}
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 5 }}
              activeDot={{ r: 7 }}
              name="Actual Revenue"
              isAnimationActive={true}
            />

            {/* Target revenue line (if available) */}
            {data.some((item) => 'target' in item && item.target) && (
              <Line
                type="monotone"
                dataKey="target"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#f59e0b', r: 4 }}
                name="Target"
                isAnimationActive={true}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
