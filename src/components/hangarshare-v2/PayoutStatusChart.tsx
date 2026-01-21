// Component: Payout Status Chart
// File: src/components/hangarshare-v2/PayoutStatusChart.tsx
// Purpose: Donut chart showing payout status distribution

'use client';

import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface PayoutStatusChartProps {
  pending: number;
  processed: number;
  failed: number;
}

const COLORS = {
  processed: '#10b981',
  pending: '#f59e0b',
  failed: '#ef4444',
};

export function PayoutStatusChart({
  pending,
  processed,
  failed,
}: PayoutStatusChartProps) {
  const data = [
    { name: 'Processed', value: processed, color: COLORS.processed },
    { name: 'Pending', value: pending, color: COLORS.pending },
    { name: 'Failed', value: failed, color: COLORS.failed },
  ].filter((item) => item.value > 0);

  const total = pending + processed + failed;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Payout Status</h3>
        <p className="text-sm text-gray-600">{total} total payouts</p>
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number | undefined) => {
                if (value === undefined) return 'N/A';
                return value.toString();
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
          No payout data available
        </div>
      )}

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs font-medium text-gray-600">Processed</p>
          <p className="text-lg font-bold text-green-600">{processed}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600">Pending</p>
          <p className="text-lg font-bold text-amber-600">{pending}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600">Failed</p>
          <p className="text-lg font-bold text-red-600">{failed}</p>
        </div>
      </div>
    </div>
  );
}
