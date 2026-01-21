// Component: Occupancy Chart
// File: src/components/hangarshare-v2/OccupancyChart.tsx
// Purpose: Display occupancy rate using area chart

'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface OccupancyData {
  date: string;
  occupancy: number;
  capacity?: number;
}

interface OccupancyChartProps {
  data: OccupancyData[];
  height?: number;
}

export function OccupancyChart({
  data,
  height = 250,
}: OccupancyChartProps) {
  return (
    <div className="w-full bg-white rounded-lg border-2 border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Occupancy Rate</h3>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <p>No data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              label={{ value: '%', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(1)}%` : 'N/A'}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="occupancy"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorOccupancy)"
              name="Occupancy %"
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
