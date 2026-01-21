// Component: Commission Chart
// File: src/components/hangarshare-v2/CommissionChart.tsx
// Purpose: Pie chart showing commission breakdown by status

'use client';

import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface CommissionChartProps {
  collected: number;
  pending: number;
  rate: number;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export function CommissionChart({ collected, pending, rate }: CommissionChartProps) {
  const failed = 0; // Placeholder
  const data = [
    { name: 'Collected', value: collected, color: COLORS[0] },
    { name: 'Pending', value: pending, color: COLORS[1] },
    { name: 'Failed', value: failed, color: COLORS[2] },
  ].filter((item) => item.value > 0);

  const total = collected + pending + failed;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Commission Status</h3>
        <p className="text-sm text-gray-600">
          {rate}% commission rate on all bookings
        </p>
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number | undefined) => {
                if (value === undefined) return 'N/A';
                return `$${value.toLocaleString()}`;
              }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No commission data available
        </div>
      )}

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs font-medium text-gray-600">Collected</p>
          <p className="text-lg font-bold text-green-600">${collected.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600">Pending</p>
          <p className="text-lg font-bold text-amber-600">${pending.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600">Total</p>
          <p className="text-lg font-bold text-gray-900">${total.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
